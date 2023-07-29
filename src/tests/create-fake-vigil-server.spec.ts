import fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import { delay } from '../utils/ya-workload.spec';

export function createFakeVigilServer() {
  const server = fastify({ logger: true });
  server.post('/reporter/:probe_id/:node_id/', async (request: FastifyRequest, reply: FastifyReply) => {
    const { probe_id, node_id } = request.params as any;
    const { replica, interval, load } = request.body as any;

    try {
      if (!probe_id) {
        throw new Error('Invalid empty probe_id!');
      }
      if (!node_id) {
        throw new Error('Invalid empty node_id!');
      }
      if (!replica) {
        throw new Error('Invalid empty replica (replica_id)!');
      }
      if (!interval) {
        throw new Error('Invalid empty interval!');
      }
      if (!load) {
        throw new Error('Invalid empty load!');
      }

      if (probe_id === 'timeout') {
        await delay(3000);
      }
      if (probe_id === 'invalid') {
        throw new Error('Invalid probe_id!');
      }
      if (probe_id === 'invalid_whtml') {
        reply.status(405).type('text/html').send('<html><head></head><body>Not mutant allowed</body></html>');
        return;
      }
      if (node_id === 'invalid') {
        throw new Error('Invalid node_id!');
      }
      if (replica === 'invalid') {
        throw new Error('Invalid replica (replica_id)!');
      }
      reply.status(200).send('OK');
    } catch (error) {
      reply.status(400).send((error as Error).message);
    }
  });
  server.delete('/reporter/:probe_id/:node_id/:replica/', async (request: FastifyRequest, reply: FastifyReply) => {
    const { probe_id, node_id, replica } = request.params as any;

    try {
      if (!probe_id) {
        throw new Error('Invalid empty probe_id!');
      }
      if (!node_id) {
        throw new Error('Invalid empty node_id!');
      }
      if (!replica) {
        throw new Error('Invalid empty replica (replica_id)!');
      }
      if (probe_id === 'timeout') {
        await delay(3000);
      }
      if (probe_id === 'invalid') {
        throw new Error('Invalid probe_id!');
      }
      if (probe_id === 'invalid_whtml') {
        reply.status(405).type('text/html').send('<html><head></head><body>Not mutant allowed</body></html>');
        return;
      }
      if (node_id === 'invalid') {
        throw new Error('Invalid node_id!');
      }
      if (replica === 'invalid') {
        throw new Error('Invalid replica (replica_id)!');
      }
      reply.status(200).send('OK');
    } catch (error) {
      reply.status(400).send((error as Error).message);
    }
  });

  return server;
}

describe('create-fake-vigil-server', () => {
  //
});
