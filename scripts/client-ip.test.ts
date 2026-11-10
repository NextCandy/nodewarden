import test from 'node:test';
import assert from 'node:assert/strict';
import { getClientIdentifier, lastForwardedForAddress } from '../src/services/ratelimit';

function req(headers: Record<string, string>): Request {
  return new Request('https://vault.example.com/identity/connect/token', { headers });
}

test('CF-Connecting-IP 优先于其他代理头', () => {
  const id = getClientIdentifier(req({ 'CF-Connecting-IP': '203.0.113.7', 'X-Forwarded-For': '198.51.100.1' }));
  assert.equal(id, getClientIdentifier(req({ 'CF-Connecting-IP': '203.0.113.7' })));
});

test('X-Forwarded-For 取最右侧地址，客户端伪造的最左值不生效', () => {
  assert.equal(lastForwardedForAddress(req({ 'X-Forwarded-For': '1.1.1.1, 203.0.113.9' })), '203.0.113.9');
  const spoofedA = getClientIdentifier(req({ 'X-Forwarded-For': '1.1.1.1, 203.0.113.9' }));
  const spoofedB = getClientIdentifier(req({ 'X-Forwarded-For': '8.8.8.8, 203.0.113.9' }));
  assert.ok(spoofedA);
  assert.equal(spoofedA, spoofedB);
});

test('X-Forwarded-For 为空或只有分隔符时返回 null', () => {
  assert.equal(lastForwardedForAddress(req({})), null);
  assert.equal(lastForwardedForAddress(req({ 'X-Forwarded-For': ' , ' })), null);
});
