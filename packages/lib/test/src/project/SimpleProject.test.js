'use strict';
require('../../setup');

import SimpleProject from '../../../src/project/SimpleProject';
import shouldManageProxies from './ProxyProject.behaviour';
import shouldManageDependencies from './DependenciesProject.behaviour';
import shouldManageImplementations from './Implementations.behaviour';
import noop from 'lodash.noop';
import Contracts from '../../../src/artifacts/Contracts';
import utils from 'web3-utils';

const ImplV1 = Contracts.getFromLocal('DummyImplementation');
const ImplV2 = Contracts.getFromLocal('DummyImplementationV2');

contract('SimpleProject', function(accounts) {
  accounts = accounts.map(utils.toChecksumAddress);
  const [_, owner, another] = accounts;
  const name = 'MyProject';

  beforeEach('initializing', async function() {
    this.project = new SimpleProject(name, null, { from: owner });
    this.adminAddress = owner;
  });

  describe('without setImplementation', function() {
    shouldManageProxies({
      supportsNames: false,
      otherAdmin: another,
      setImplementations: noop,
    });
  });

  describe('with setImplementation', function() {
    shouldManageProxies({
      supportsNames: true,
      otherAdmin: another,
      setImplementations: async function() {
        this.implementationV1 = await this.project.setImplementation(ImplV1, 'DummyImplementation');
        this.implementationV2 = await this.project.setImplementation(ImplV2, 'DummyImplementationV2');
      },
    });

    it('unsets an implementation', async function() {
      await this.project.setImplementation(ImplV1, 'DummyImplementation');
      this.project.unsetImplementation('DummyImplementation');
      this.project.implementations.should.not.have.key('DummyImplementation');
    });
  });

  shouldManageDependencies();
  shouldManageImplementations();
});
