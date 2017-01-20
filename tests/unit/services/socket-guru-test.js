import SocketGuruService from 'ember-socket-guru/services/socket-guru';
import { module, test } from 'qunit';
import sinon from 'sinon';
import Ember from 'ember';

const { get, run } = Ember;

module('Unit | Service | socket guru');

const socketClient = (
  setupSpy = function() {},
  subscribeSpy = function() {},
  disconnectSpy = function() {},
  unsubscribeChannelsSpy = function() {}
) => ({
  setup: setupSpy,
  subscribe: subscribeSpy,
  disconnect: disconnectSpy,
  unsubscribeChannels: unsubscribeChannelsSpy,
});

test('setup function', function(assert) {
  const setupSpy = sinon.spy();
  const disconnectSpy = sinon.spy();
  const client = socketClient(setupSpy, function() {}, disconnectSpy);
  const socketClientLookupSpy = sinon.spy(() => client);
  const config = { setting: 'FOO' };
  const service = SocketGuruService.create({
    pusherKey: 'FOO',
    config,
    socketClient: 'pusher',
    socketClientLookup: socketClientLookupSpy,
  });

  assert.ok(socketClientLookupSpy.calledOnce, 'it uses socketClient lookup');
  assert.equal(socketClientLookupSpy.args[0][1], 'pusher', 'it passes proper socketClient name');
  assert.deepEqual(get(service, 'client'), client, 'it sets the client properly');
  assert.ok(setupSpy.calledOnce, 'it calls the setup function on socketClient');
  assert.deepEqual(
    setupSpy.args[0][0],
    config,
    'it calls the setup function on socketClient passing the config'
  );

  run(() => {
    service.destroy();
  });

  assert.ok(
    disconnectSpy.calledOnce,
    'it calls the unsubscribe function on socketClient when destroyed'
  );
});

test('it delegates subscription to socketClient', function(assert) {
  const subscribeSpy = sinon.spy();
  const observedChannels = [
      { channel1: ['event1'] },
  ];
  const socketClientLookup = () => socketClient(function() {}, subscribeSpy);
  SocketGuruService.create({
    autoConnect: true,
    observedChannels,
    socketClientLookup,
    socketClient: 'pusher',
  });

  assert.ok(subscribeSpy.calledOnce, 'it calls the subscribe function on socketClient');
  assert.deepEqual(
    subscribeSpy.args[0][0],
    observedChannels,
    'it passes the observed channels to the subscribe function on socketClient'
  );
});

test('it calls subscribe on socketClient only if autoConnect true', function(assert) {
  const subscribeSpy = sinon.spy();
  const setupSpy = sinon.spy();
  const socketClientLookup = () => socketClient(setupSpy, subscribeSpy);
  SocketGuruService.create({
    socketClientLookup,
    socketClient: 'pusher',
  });

  assert.ok(
    subscribeSpy.calledOnce && setupSpy.calledOnce,
    'it calls the setup and subscribe functions by default'
  );
});

test('it doesnt call subscribe on on socketClient if autoConnect false', function(assert) {
  const subscribeSpy = sinon.spy();
  const setupSpy = sinon.spy();
  const socketClientLookup = () => socketClient(setupSpy, subscribeSpy);
  SocketGuruService.create({
    autoConnect: false,
    socketClientLookup,
    socketClient: 'pusher',
  });

  assert.notOk(
    subscribeSpy.calledOnce || setupSpy.calledOnce,
    'it doesnt call setup and subscribe'
  );
});

test('adding observed channels', function(assert) {
  const subscribeSpy = sinon.spy();
  const unsubscribeChannelsSpy = sinon.spy();
  const socketClientLookup = () => {
    return socketClient(
      function() {}, subscribeSpy, function() {}, unsubscribeChannelsSpy
    );
  };
  const service = SocketGuruService.create({
    client: socketClientLookup(),
    autoConnect: false,
    observedChannels: [{ oldChannel: ['oldData'] }],
    socketClient: 'pusher',
  });

  const channelsToAdd = { testChannel: ['event1'] };
  service.addObservedChannels(channelsToAdd);

  assert.ok(subscribeSpy.calledOnce, 'it calls the subscribe method on the client');
  assert.deepEqual(
    subscribeSpy.args[0][0],
    [channelsToAdd],
    'it passes proper arguments to the client'
  );
});

test('updating existing channels', function(assert) {
  const subscribeSpy = sinon.spy();
  const unsubscribeChannelsSpy = sinon.spy();
  const socketClientLookup = () => {
    return socketClient(
      function() {}, subscribeSpy, function() {}, unsubscribeChannelsSpy
    );
  };
  const service = SocketGuruService.create({
    client: socketClientLookup(),
    autoConnect: false,
    observedChannels: [{ oldChannel: ['oldData'] }],
    socketClient: 'pusher',
  });

  const channelsToUpdate = { testChannel: ['event1'] };
  service.updateObservedChannels([channelsToUpdate]);

  assert.ok(subscribeSpy.calledOnce, 'it calls the subscribe method on the client');
  assert.deepEqual(
    subscribeSpy.args[0][0],
    [channelsToUpdate],
    'it passes proper channels to unsubscribe'
  );

  assert.ok(unsubscribeChannelsSpy.calledOnce, 'it calls the unsubscribe method on the client');
  assert.deepEqual(
    unsubscribeChannelsSpy.args[0][0],
    [{ oldChannel: ['oldData'] }],
    'it passes proper channels for the client to unsubscribe'
  );
});

test('removing channels', function(assert) {
  const subscribeSpy = sinon.spy();
  const unsubscribeChannelsSpy = sinon.spy();
  const socketClientLookup = () => {
    return socketClient(
      function() {}, subscribeSpy, function() {}, unsubscribeChannelsSpy
    );
  };
  const service = SocketGuruService.create({
    client: socketClientLookup(),
    autoConnect: false,
    observedChannels: [{ oldChannel: ['oldData'] }, { oldChannel2: ['oldEvent2'] }],
    socketClient: 'pusher',
  });

  service.removeObservedChannel('oldChannel');

  assert.ok(unsubscribeChannelsSpy.calledOnce, 'it calls the unsubscribe method on the client');
});
