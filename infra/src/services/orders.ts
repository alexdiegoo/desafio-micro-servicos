import * as pulumi from '@pulumi/pulumi'
import * as awsx from "@pulumi/awsx";
import { ordersDockerImage } from "../images/orders"
import { cluster } from "../cluster"
import { appLoadBalancer } from '../load-balancer';
import { amqpListener } from './rabbitmq';

const ordersTargetGroup = appLoadBalancer.createTargetGroup('orders-target', {
  port: 3333,
  protocol: 'HTTP',
  healthCheck: {
    path: '/health',
    protocol: 'HTTP'
  }
})

export const ordersHttpListener = appLoadBalancer.createListener('orders-listener', {
  port: 3333,
  protocol: 'HTTP',
  targetGroup: ordersTargetGroup
})



export const ordersService = new awsx.classic.ecs.FargateService('fargate-order', {
  cluster,
  desiredCount: 1,
  waitForSteadyState: false,
  taskDefinitionArgs: {
    container: {
      image: ordersDockerImage.ref,
      portMappings: [ordersHttpListener],
      cpu: 256,
      memory: 512,
      environment: [
        { 
          name: 'BROKER_URL', 
          value: pulumi.interpolate`amqp://admin:admin@${amqpListener.endpoint.hostname}:${amqpListener.endpoint.port}` 
        },
        {
          name: 'DATABASE_URL',
          value: ''
        },
        {
          name: 'OTEL_TRACES_EXPORTER',
          value: 'otlp'
        },
        {
          name: 'OTEL_SERVICE_NAME',
          value: 'orders'
        },
        {
          name: 'OTEL_EXPORTER_OTLP_ENDPOINT',
          value: ''
        },
        {
          name: 'OTEL_EXPORTER_OTLP_HEADERS',
          value: ''
        },
        {
          name: 'OTEL_RESOURCE_ATTRIBUTES',
          value: ''
        },
        {
          name: 'OTEL_NODE_RESOURCE_DETECTORS',
          value: 'env,host,os'
        },
        {
          name: 'OTEL_NODE_ENABLED_INSTRUMENTATIONS',
          value: 'http,fastify,pg,amqplib'
        }
      ],
    },
  }
})