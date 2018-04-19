// bind to drop events
$(function() {
	$("#space")
		.on('drag dragstart dragend dragover dragenter dragleave drop', function(e) {
			e.preventDefault();
			e.stopPropagation();
		})
		.on('drop', function(e) {
			console.log("Dropped file");
			var files = e.originalEvent.dataTransfer.files;
			var reader = new FileReader()
			reader.onloadend = function(e) {
				securities.clear();
				var lines = reader.result.split(/(\r?\n){3,}/)[0]
										 .split(/(?:\r?\n)+/)
										 .slice(1);
				for (var i=0; i<lines.length; i++) {
					securities.add( new Security(lines[i]) );
				}
			};
			reader.readAsText(files[0]);
		});
});


function Security(line) {
	var self = this;

	//initialise
	var cols = line.split(',');
	this.account = cols[0];
	this.name = cols[1];
	this.symbol = cols[2];
	this.quantity = parseFloat(cols[3]);
	this.price = parseFloat(cols[4]);
	this.id = [this.account, this.symbol].join('-');

	this.value = function() {
		return self.quantity * self.price;
	};

	this.base = function() {
		var allocation = self.allocation();
		if (allocation == 0) { return 0; }
		return self.value()/allocation;
	};

	this.allocation = function() {
		if (self.symbol == "VTI") { return 0.65; }
		if (self.symbol == "VXUS") { return 0.25; }
		if (self.symbol == "BND") { return 0.07; }
		if (self.symbol == "BNDX") { return 0.03; }
		return 0;
	};

	this.purchase_amt = function(base) {
		var alloc = (self.allocation() * base).toFixed(2);
		var diff = (alloc - self.value()).toFixed(2);
		var quantity = Math.ceil(diff/self.price);
		return quantity;
	};
}

function SecurityList() {
	var self = this;

	self.cash = ko.observable(0);
	self.securities = ko.observableArray([]);


	self.add = function add(s) {
		//filter accounts
		if (s.symbol == 'VMFXX') { self.cash( parseFloat(s.value()) ); }
		if (!['VTI', 'VXUS', 'BND', 'BNDX'].includes(s.symbol)) { return; }
		self.securities.push(s);
	};

	self.clear = function clear() {
		self.securities([]);
	};

	self.base = ko.pureComputed(function() {
		var total = self.securities().reduce(function(sum, sec) {
			return sum + sec.value();
		}, self.cash());

		var base = self.securities().reduce(function(base, sec) {
			return Math.max(base, sec.base());
		}, total);

		return base;
	});
}

var securities = new SecurityList();
$(function() {
	ko.applyBindings(securities);

	ko.bindingHandlers.percentage = {
		update: function(element, valueAccessor) {
			var value = ko.utils.unwrapObservable(valueAccessor());
			ko.bindingHandlers.text.update(element, function() {
				var p = (value*100).toFixed(0);
				return p+"%";
			});
		}
	}
});
