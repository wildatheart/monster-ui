define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),

		templates = {
			menu: 'menu',
			transactions: 'transactions',
			listTransactions: 'listTransactions'
		};

	var app = {

		name: 'myaccount-transactions',

		i18n: [ 'en-US', 'fr-FR' ],

		requests: {
			'transactions.getMonthly': {
				url: 'accounts/{accountId}/transactions/monthly_recurring?created_from={from}&created_to={to}',
				verb: 'GET'
			},
			'transactions.getSubscriptions': {
				url: 'accounts/{accountId}/transactions/subscriptions',
				verb: 'GET'
			},
			'transactions.getCharges': {
				url: 'accounts/{accountId}/transactions?reason=no_call&created_from={from}&created_to={to}',
				verb: 'GET'
			}
		},

		subscribe: {
			'myaccount-transactions.renderContent': '_renderContent'
		},

		load: function(callback){
			var self = this;

			self.whappAuth(function() {
				callback && callback(self);
			});
		},

		whappAuth: function(callback) {
			var self = this;

			monster.pub('auth.sharedAuth', {
				app: self,
				callback: callback
			});
		},

		render: function(account){
			var self = this,
				transactionsMenu = $(monster.template(self, 'menu')),
				args = {
					name: self.name,
					title: self.i18n.active().title,
					menu: transactionsMenu,
					weight: 10,
					category: 'billingCategory'
				};

			monster.pub('myaccount.addSubmodule', args);
		},

		_renderContent: function(args) {
			var self = this,
				range = 31,
				now = new Date(),
				to = monster.ui.dateToGregorian(new Date(now.setDate(now.getDate() + 1))),
				from = to - (range * 60 * 60 * 24);

			self.listTransactions(from, to, function(data) {
				var transactionsView = $(monster.template(self, 'transactions', data)),
					listTransactionsView = monster.template(self, 'listTransactions', data);

				transactionsView.find('.list-transactions').append(listTransactionsView);

				monster.ui.initRangeDatepicker(range, transactionsView);

				self.bindEvents(transactionsView);

				monster.pub('myaccount.renderSubmodule', transactionsView);
			});
		},

		cleanFormData: function(module, data) {
			delete data.extra;

			return data;
		},

		formatData: function(data) {
			var self = this;

			data.amount = parseFloat(data.amount).toFixed(2);

			if(data.listTransactions) {
				$.each(data.listTransactions, function(k, v) {
					v.reason = self.i18n.active()[v.reason ? v.reason : 'oneTimeCharge'];
				});
			}

			return data;
		},

		bindEvents: function(parent, data) {
			var self = this;

			parent.find('.expandable').hide();

			parent.on('click', '.expand-box', function() {
				var current = $(this),
					expandable = current.parents('.transaction').first().find('.expandable'),
					content = !expandable.is(':visible') ? '-' : '+';

				current.find('.expand').html(content);
				expandable.slideToggle('fast');
			});

			parent.find('#filter_transactions').on('click', function() {
				from = monster.ui.dateToGregorian(new Date(parent.find('#startDate').val()));
				to = monster.ui.dateToGregorian(new Date(parent.find('#endDate').val()));

				self.listTransactions(from, to, function(data) {
					var listTransactions = parent.find('.list-transactions').empty();

					listTransactions.append(monster.template(self, 'listTransactions', data));

					parent.find('.expandable').hide();

					parent.find('.billing-date.start').html(data.billingStartDate);
					parent.find('.billing-date.end').html(data.billingEndDate);
					parent.find('.total-amount').html(data.amount);
				});
			});
		},

		//utils
		listTransactions: function(from, to, callback) {
			var self = this,
				defaults = {
					amount: 0.00,
					billingStartDate: monster.ui.toFriendlyDate(from, 'short'),
					billingEndDate: monster.ui.toFriendlyDate(to, 'short')
				};

			monster.parallel({
					monthly: function(callback) {
						self.getMonthlyTransactions(from, to, function(dataMonthly) {
							var arrayTransactions = [];

							$.each(dataMonthly.data, function(k, v) {
								if(v.add_ons.length === 0 && v.discounts.length === 0) {
									v.type = 'charges';
								}
								else {
									v.type = v.prorated ? 'prorated' : 'monthly';
									v.services = [];

									$.each(v.add_ons, function(k, addOn) {
										addOn.amount = parseFloat(addOn.amount).toFixed(2);
										addOn.quantity = parseFloat(addOn.quantity);
										addOn.monthly_charges = (addOn.amount * addOn.quantity).toFixed(2);

										v.services.push({
											service: i18n.t('myaccount.service_plan.'+addOn.id),
											rate: addOn.amount,
											quantity: addOn.quantity,
											discount: '',
											monthly_charges: addOn.monthly_charges
										});
									});
								}

								v.amount = parseFloat(v.amount).toFixed(2);
								v.created = monster.ui.toFriendlyDate(v.created_at, 'short');
								arrayTransactions.push(v);

								defaults.amount += parseFloat(v.amount);
							});

							callback(null, arrayTransactions);
						});
					},
					charges: function(callback) {
						self.getCharges(from, to, function(dataCharges) {
							var arrayCharges = [];

							$.each(dataCharges.data, function(k, v) {
								v.type = 'charges';
								v.amount = parseFloat(v.amount).toFixed(2);
								v.created = monster.ui.toFriendlyDate(v.created, 'short');
								arrayCharges.push(v);

								defaults.amount += parseFloat(v.amount);
							});

							callback(null, arrayCharges);
						});
					}
				},
				function(err, results) {
					var renderData = defaults;

					renderData.listTransactions = (results.charges).concat(results.monthly);

					renderData = self.formatData(renderData);

					callback(renderData);
				}
			);
		},

		getMonthlyTransactions: function(from, to, success, error) {
			var self = this;

			monster.request({
				resource: 'transactions.getMonthly',
				data: {
					accountId: self.accountId,
					from: from,
					to: to
				},
				success: function(data, status) {
					success && success(data, status);
				},
				error: function(data, status) {
					error && error(data, status);
				}
			});
		},

		getSubscriptions: function(success, error) {
			var self = this;

			monster.request({
				resource: 'transactions.getSubscriptions',
				data: {
					accountId: self.accountId,
				},
				success: function(data, status) {
					success && success(data, status);
				},
				error: function(data, status) {
					error && error(data, status);
				}
			});
		},

		getCharges: function(from, to, success, error) {
			var self = this;

			monster.request({
				resource: 'transactions.getCharges',
				data: {
					accountId: self.accountId,
					from: from,
					to: to
				},
				success: function(data, status) {
					success && success(data, status);
				},
				error: function(data, status) {
					error && error(data, status);
				}
			});
		}
	};

	return app;
});