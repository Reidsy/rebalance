// bind to drop events
$(function() {
	var space = $("#space");
	space.on('drag dragstart dragend dragover dragenter dragleave drop', function(e) {
		e.preventDefault();
		e.stopPropagation();
	})
	.on('drop', function(e) {
		console.log("Dropped file");
		var files = e.originalEvent.dataTransfer.files;
		var reader = new FileReader()
		reader.onloadend = function(e) {
			var lines = parseLines(reader.result);
			for (var i=0; i < lines.length; i++) {
				var s = new Security(lines[i]);
				securities.add(s);
			}
		};
		reader.readAsText(files[0]);

	});
});

function parseLines(text) {
	var lines = text.split(/\r?\n/g);
	var i=1;
	while(lines[i].length > 0) { i++; }
	return lines.slice(1, i);
}

function Security(line) {
	var self = this;

	this.value = function() {
		return (self.quantity * self.price).toFixed(2);
	};

	this.allocation = function() {
		if (self.symbol == "VTI") { return 0.65; }
		if (self.symbol == "VXUS") { return 0.25; }
		if (self.symbol == "BND") { return 0.07; }
		if (self.symbol == "BNDX") { return 0.03; }
		return 0;
	}

	this.purchase_amt = function(base) {
		if (self.allocation() == 0) { return 0; }
		var value = base*self.allocation()*100 - self.value();
		var count = value/self.price;
		return Math.floor(count);
	};

	//initialise
	var cols = line.split(',');
	if (cols.length > 0) {
		this.account = cols[0];
		this.name = cols[1];
		this.symbol = cols[2];
		this.quantity = parseFloat(cols[3]);
		this.price = parseFloat(cols[4]);
	}


}

function SecurityList() {
	var self = this;

	self.securities = ko.observableArray([]);

	self.add = function add(s) {
		self.securities.push(s);
	};

	self.base = function base(newmoney) {
		var total = 0;
		var bases = self.securities().map(function(s) {
			if (s.symbol == "VMFXX") { total += s.value()*1; }
			if (s.allocation() == 0) { return 0; }
			total += s.value()*1;
			return s.value()/(s.allocation()*100);
		});
		bases.push(total/100);
		return Math.max(...bases);
	};
}

var securities = new SecurityList();
$(function() {
	ko.applyBindings(securities);

	ko.bindingHandlers.percentage = {
		update: function(element, valueAccessor) {
			var value = ko.utils.unwrapObservable(valueAccessor());
			ko.bindingHandlers.text.update(element, function() { return value*100+"%"; });
		}
	}
});
