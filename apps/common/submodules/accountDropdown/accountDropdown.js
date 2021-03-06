define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster');

	var accountDropdown = {
		requests: {

		},

		subscribe: {
			'common.selectAccount': 'accountDropdownRender'
		},

		/* Events */
		accountDropdownRender: function(args) {
			var self = this,
				originalAccountTree = args.accountsTree,
				currentAccountTree = originalAccountTree,
				parent = args.parent;

			var accountErrName = self.i18n.active().accountDropdown.missingAccount,
				layout = monster.template(self, 'accountDropdown-layout'),
				template = monster.template(self, 'accountDropdown-list', { 
					accounts: $.map(currentAccountTree, function(val, key) {
						val.id = key;
						return val;
					}).sort(function(a,b) {
						return (a.name || accountErrName).toLowerCase() > (b.name || accountErrName).toLowerCase() ? 1 :-1;
					})
				});

			parent
				.find('.accounts-dropdown')
				.empty()
				.append(layout)
				.find('.account-list')
				.append(template);

			parent.on('click', '.accounts-dropdown .account-children-link', function(e) {
				e.stopPropagation();

				var slider = parent.find('.account-slider'),
					list = parent.find('.account-list'),
					accountId = $(this).parent().data('id');

				currentAccountTree = currentAccountTree[accountId].children;

				var template = monster.template(self, 'accountDropdown-list', { 
					accounts: $.map(currentAccountTree, function(val, key) {
						val.id = key;
						return val;
					}).sort(function(a,b) {
						return (a.name || accountErrName).toLowerCase() > (b.name || accountErrName).toLowerCase() ? 1 :-1;
					})
				});

				slider
					.empty()
					.append(template);

				list.animate({ marginLeft: -list.outerWidth() }, 400, 'swing', function() {
					list.empty()
						 .append(template)
						 .css('marginLeft','0px');

					slider.empty();
				});
			});

			/* When clicking on a bootstrap dropdown, it hides the dropdown, that's a hack to prevent it and allow us to type in the search field! */
			parent.on('click', '.accounts-dropdown .search-box', function(e) {
				e.stopPropagation();
			});

			parent.on('keyup', '.accounts-dropdown #account_search_input', function(e) {
				e.stopPropagation();
				var search = $(this).val();

				if(search) {
					$.each(parent.find('.account-list-element'), function(k, v) {
						var current = $(v);

						current.find('.account-link').html().toLowerCase().indexOf(search.toLowerCase()) >= 0 ? current.show() : current.hide();
					});
				}
				else {
					parent.find('.account-list-element').show();
				}
			});

			/* Move Numbers */
			parent.on('click', '.accounts-dropdown .account-link', function(event) {
				var $this = $(this);
				if($this.hasClass('disabled')) {
					event.stopPropagation();
				} else {
					var destinationAccountId = $this.parent().data('id'),
						destinationAccountName = $this.find('.account-name').text();

					args.callbacks.clickAccount && args.callbacks.clickAccount(destinationAccountId, destinationAccountName);
				}
			});

			var dropdown = {
				reset: function() {
					currentAccountTree = originalAccountTree;

					var layout = monster.template(self, 'accountDropdown-layout'),
						template = monster.template(self, 'accountDropdown-list', { 
							accounts: $.map(currentAccountTree, function(val, key) {
								val.id = key;
								return val;
							}).sort(function(a,b) {
								return (a.name || accountErrName).toLowerCase() > (b.name || accountErrName).toLowerCase() ? 1 :-1;
							})
						});

					parent
						.find('.accounts-dropdown')
						.empty()
						.append(layout)
						.find('.account-list')
						.append(template);
				}
			};

			args.callbacks.loaded && args.callbacks.loaded(dropdown);
		}
	};

	return accountDropdown;
});
