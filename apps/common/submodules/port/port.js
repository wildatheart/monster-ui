define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		bootstrapSwitch = require('bootstrap-switch'),
		fileUpload = require('fileupload'),
		monster = require('monster'),
		timepicker = require('timepicker'),
		toastr = require('toastr');

	var app = {

		requests: {
			'common.port.numbers.info': {
				apiRoot: 'http://69.164.206.244/number_manager/api/index.php/',
				url: 'numbers/{country}/meta',
				verb: 'POST'
			}
		},

		subscribe: {
			'common.port.render': 'portRender'
		},

		portRender: function(args) {
			var self = this,
				args = args || {},
				accountId = args.hasOwnProperty('accountId') ? args.accountId : self.accountId,
				dialogOptions = { width: '940px', position: ['center', 20], title: self.i18n.active().port.dialogTitle },
				parent;

			if (args.hasOwnProperty('parent')) {
				parent = $(args.parent);

				if (parent.hasClass('ui-dialog-content')) {
					parent.parent().remove();
					parent = monster.ui.dialog('', dialogOptions);
				}
				else {
					parent.empty();
					parent = $('#ws-content');
				}
			}
			else {
				parent = monster.ui.dialog('', dialogOptions);
			}

			self.portRenderPendingOrders(accountId, parent);
			}
		},

		portRenderPendingOrders: function(accountId, parent) {
			var self = this;

			self.callApi({
				resource: 'port.list',
				data: {
					accountId: accountId
				},
				success: function(data, status) {
					var dataTemplate = (function formatToTemplate(data) {
							var output = [];

							_.each(data, function(order){
								var date = monster.util.gregorianToDate(order.created),
									formattedOrder = $.extend({}, order, {
										created: (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear(),
										status: order.port_state === 'ready' ? true : false
									});

								output.push(formattedOrder);
							});

							output.sort(function(a, b){
								return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1;
							});

							return output;
						})(data.data),
						pendingOrdersTemplate = monster.template(self, 'port-pendingOrders', { data: dataTemplate });

					parent
						.empty()
						.append(pendingOrdersTemplate);

					self.portBindPendingOrdersEvents(accountId, parent);
				}
			});
		},

		portBindPendingOrdersEvents: function(accountId, parent) {
			var self = this,
				container = parent.find('#orders_list');
		},

		portRenderAddNumbers: function(accountId, parent) {
			var self = this;

			self.portBindAddNumbersEvents(account, parent);
		},

		portBindAddNumbersEvents: function(accountId, parent) {
			var self = this,
				container = parent.find('#add_numbers');
		},

		portRenderManagerOrders: function(accountId, parent) {
			var self = this;

			self.portBindManagerOrdersEvents(accountId, parent);
		},

		portBindManagerOrdersEvents: function(accountId, parent) {
			var self = this,
				container = parent.find('#port_container');
		},

		portRenderSubmitDocuments: function(accountId, parent) {
			var self = this;

			self.portBindSubmitDocumentsEvents(accountId, parent);
		},

		portBindSubmitDocumentsEvents: function(accountId, parent) {
			var self = this,
				container = parent.find('#port_container');
		},

		portRenderConfirmOrder: function(accountId, parent) {
			var self = this;

			self.portBindConfirmOrderEvents(accountId, parent);
		},

		portBindConfirmOrderEvents: function(accountId, parent) {
			var self = this,
				container = parent.find('#port_container');
		}

		/* Methods */

		portCheckPhoneNumbers: function(numbers, callback) {
			var self = this;

			monster.request({
				resource: 'common.port.numbers.info',
				data: {
					data: numbers,
					country: 'US'
				},
				success: function(data, status) {
					data = data.data;

					var errors = [],
						orders = [],
						carriers = [];

					for (var num in data) {
						var company = data[num].company;

						if (_.isNull(company)) {
							errors.push(num);
							continue;
						}
						else if (carriers.indexOf(company) === -1) {
							carriers.push(company);
							orders.push({
								carriers: company,
								numbers: []
							});
						}

						orders[carriers.indexOf(company)].numbers.push(num);
					}

					callback({ orders: orders }, errors);
				}
			});
		},

		portComingSoon: function() {
			var self = this;

			_.each(arguments, function(val){
				val.on('click', function(event) {
					event.preventDefault();

					monster.ui.alert('Coming Soon!');
				});
			});
		}
	};

	return app;
});
