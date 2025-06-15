import '@opentelemetry/auto-instrumentations-node/register'

import { trace } from '@opentelemetry/api'

import { setTimeout } from 'node:timers/promises'

import { fastify } from 'fastify'
import { randomUUID } from 'node:crypto'
import { fastifyCors } from '@fastify/cors'
import { z } from 'zod'
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider
} from 'fastify-type-provider-zod'

import { db } from '../db/client.ts'
import { schema } from '../db/schema/index.ts'
import { dispatchOrderCreated } from '../broker/messages/order-created.ts'
import { tracer } from '../tracer/tracer.ts'

const app = fastify().withTypeProvider<ZodTypeProvider>()

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

app.register(fastifyCors, { origin: '*' })

app.get('/health', () => {
  return 'OK'
})

app.post('/orders', {
  schema: {
    body: z.object({
      amount: z.coerce.number(),
    })
  }
},async (request, reply) => {
  const { amount } = request.body

  const orderId = randomUUID()


  const span = tracer.startSpan('eu acho que aqui ta dando merda')

  span.setAttribute('teste', 'hello world')
  await setTimeout(2000)
  span.end()

  trace.getActiveSpan()?.setAttribute('order_id', orderId)

  dispatchOrderCreated({
    orderId,
    amount: Number(amount),
    customer: {
      id: randomUUID()
    }
  }) 

  console.log('Creating an order with amount', amount)


  //const customerId = randomUUID()

  try {
    /*await db.insert(schema.customers).values({
      id: customerId,
      address: "Teste",
      country: "BR",
      email: "teste2@gmail.com",
      name: "Alex",
      state: "Teste",
      zipCode: "23123",
      dateOfBirth: new Date('2003-09-08')
    })*/
  
    /*await db.insert(schema.orders).values({
      id: randomUUID(),
      customerId: randomUUID(),
      amount: Number(amount),
    })

    console.log(customerId)*/

    return reply.status(201).send()
  } catch(error) {
    console.log(error);
  }
 
})

app.listen({ host: '0.0.0.0', port: 3333 }).then(() => {
  console.log('[Orders] HTTP Server running!')
})