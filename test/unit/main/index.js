'use strict';


const CWD = process.cwd();
const Code = require('code');
const expect = Code.expect;
const path = require('path');

const main = require(path.join(CWD));


describe('Main', () => {

	require('./api')(main);

	describe('default services', () => {
		require('./ext')(main);
	});



	describe('bootstrap(module)', () => {

		describe('result', () => {

			let res;
			beforeEach(() => {
				const app = main.module('app');

				return main.bootstrap(app)
					.then((_res) => {
						res = _res;
					});
			});


			it('should have method: get()', () => {
				expect(res.get)
					.to.be.a.function();
			});

			it('should have method: invoke()', () => {
				expect(res.invoke)
					.to.be.a.function();
			});

			it('should have method: instantiate()', () => {
				expect(res.instantiate)
					.to.be.a.function();
			});


		});

	});



	describe('config', () => {


		let app;
		beforeEach(() => {
			app = main.module('app');
		});

		it('should execute config methods', () => {

			app.config(function($provide) {

				expect($provide)
					.to.be.an.object();

			});

			app.config(function($provide) {

				expect($provide)
					.to.be.an.object();

			});


			let countBefore = Code.count();

			main.bootstrap(app);

			expect(Code.count() - countBefore)
				.to.equal(2);

		});

	});



	describe('scenario-a', () => {

		let app;
		let injector;
		beforeEach(() => {

			app = main.module('app');

			app.service('serviceA', function() {
				this.test = 123;
			});

			class ServiceB {
				constructor() {
					this.test = 456;
				}
			}

			app.service('serviceB', ServiceB);

			return main.bootstrap(app)
				.then((i) => injector = i);

		});

		it('should have service registered on main module', () => {

			let services = injector.services;

			expect(services.serviceA)
				.to.be.an.object();

			expect(services.serviceA.test)
				.to.be.a.number()
				.and.to.equal(123);

		});

		it('should have service registered on main module', () => {

			let services = injector.services;

			expect(services.serviceB)
				.to.be.an.object();

			expect(services.serviceB.test)
				.to.be.a.number()
				.and.to.equal(456);

		});

		it('should throw error on unknown provider', () => {

			expect(function() {
				injector.get('qwe');
			})
				.to.throw(Error, 'Unknown provider: qweProvider');

		});

	});




	describe('$emit', () => {

		it('should not be available as provider in configs', () => {

			let mod = main.module('test');

			mod.config(($emitProvider) => true);

			expect(() => {
				main.bootstrap(mod);
			})
			.to.throw(Error, 'Unknown provider: $emitProvider');

		});


		it('should be available as service in run', () => {

			let mod = main.module('test');

			mod.run(($emit) => expect($emit).to.be.a.function());

			return main.bootstrap(mod);

		});


		it('should emit events to app.$on(name, handler) handlers', () => {

			let mod = main.module('test');

			mod.run(($emit) => setTimeout(() => $emit('test', 123)));


			return main.bootstrap(mod)
			.then((app) => {

				return new Promise((resolve) => app.$on('test', (data) => {
					expect(data).to.equal(123);
					resolve();
				}));

			});

		});

	});





	describe('$provide in config (important for testing)', () => {

		it('should replace factory value', () => {

			let mod = main.module('test');
			mod.factory('test', () => 123);

			mod.config(($provide) => $provide.value('test', 456));

			return main.bootstrap(mod)
				.then((app) => expect(app.get('test')).to.equal(456));

		});

	});


	describe('constants', () => {

		it('should be available in config- and run-handlers under same name', () => {

			let mod = main.module('test');

			mod.constant('abc', 123);

			mod.config((abc) => expect(abc).to.equal(123));
			mod.run((abc) => expect(abc).to.equal(123));

			return main.bootstrap(mod)
				.then((app) => expect(app.get('abc')).to.equal(123));
		});

	});





	describe('config method execution order', () => {

		it('should', () => {

			const sub = main.module('sub');


			class UserService {
				constructor(configs, $http) {
					this.config = configs;
					this.$http = $http;
				}

				create(attr) {
					attr.name = attr.name || this.config.name;
					return attr;
				}
			}
			UserService.$inject = ['config', '$http'];


			class UserProvider {

				constructor() {

					this.config = {};

					this.$get = function($injector) {
						return $injector.instantiate(UserService, {
							config: this.config
						});
					};

				}

				setDefaultName(name) {
					this.config.name = name;
				}

			}


			sub.provider('User', UserProvider);



			const app = main.module('app', [
				sub
			]);

			app.service('$http', function() {
				this.post = function() {

				};
			});

			sub.config(function(UserProvider) {
				UserProvider.setDefaultName('helen');
			});


			let injector = main.bootstrap(app);

			// TODO: finalize this test! ;)

		});



	});



});
