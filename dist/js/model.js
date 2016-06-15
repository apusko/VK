;
	var Group = function(data){

		var self = this;

		self.gid = ko.observable();
		self.name = ko.observable();
		self.id =  ko.observable();
		self.countPeople =  ko.observable();
		self.description = ko.observable('');

		self.countries = ko.observable({});
		self.country = ko.observableArray();	

		self.cities = ko.observable({});
		self.citiesByCountry = ko.observable({});

		self.city = ko.observableArray();	

		self.city = ko.observable();

		self.users = ko.observable({});

		self.posts = ko.observable({});

		self.peopleByCountry = ko.observable({});
		self.peopleByCity= ko.observable({});

	}

	var User = function(data){
		var self = this;

	}