var countries = {};

var ViewModel = function(){
	var self = this;

	// Этапы отображения
	self.statusUser = ko.observable([false]);
	self.showInfoGroup = ko.observable(false);
	self.showChooseParams = ko.observable(false);
	self.LCRLoaded = ko.observableArray([false,false,false]); // массив, отвечающий за контроль над загрузкой  лайков, репостов, комментариев.
	self.showSortedList = ko.observable(true);
	
	// Данные полученные от пользователя
	self.groupName = ko.observable('');
	self.depth = ko.observable(0);
	self.amountPeople = ko.observable(0);

	//
	self.currentGroup = ko.observable(new Group());

	self.listCountries = ko.observableArray([]);
	self.listCities = ko.observableArray([]);

	self.selectedCountry = ko.observable(null);
	self.selectedCity = ko.observable(null);

	self.certainUsers = ko.observable();
	self.certainUsersLCRForEachPost = ko.observable(); // { id_user : { id_post : [1,0,1] }}

	self.sortedList = ko.observable();

	self.postsForCertainUsersLCR = ko.observable(); // Посты в виде { date: , likes: []

	self.LCR = ko.observable({ likes : 0, reposts : 0, comments : 0 });
	self.LCRforCertainUsers = ko.observable({ likes : 0, reposts : 0, comments : 0 });

	self.getSortedListUsersByER = ko.computed(function(){
		var sortedList = sortByValue(countUsersFromGroupER(self.certainUsersLCRForEachPost()));
		// if (sortedList.length) {

		// 	// формируем список вида {month : [[1,0,1],[0,0,0]] } для конкретного пользователя
		// 	var listPostsLCRforUser = self.certainUsersLCRForEachPost()[sortedList[0][0]];
		// 	var LCRByMonth = {};
		// 	for (var key in listPostsLCRforUser){
		// 		var date = new Date(self.currentGroup().posts()[key]['date']*1000);
		// 		var month = (""+date).split(" ")[1];
		// 		if (!LCRByMonth[month]) LCRByMonth[month] = [];
		// 		LCRByMonth[month].push(listPostsLCRforUser[key]);
		// 	}
		// 	console.log(LCRByMonth);
		// }
		var arr = [];
		self.sortedList(sortedList.map(function(i){ return i[0] }));
		sortedList.slice(0,5).forEach(function(item){
			arr.push({ 
				'id' : item[0],
				'value' : item[1],
				'name' : self.currentGroup().users()[item[0]]['name']
			})
		})
		return arr;
	});

	self.getLCR = ko.computed(function(){
			if (self.LCRLoaded()[0] && self.LCRLoaded()[1] && self.LCRLoaded()[2]) {
				self.postsForCertainUsersLCR(getPostsForCertainUsersLCR(self.certainUsers(), self.currentGroup().posts()));
				
				self.LCR({ 
		      		likes : getRates(self.currentGroup().posts(),'likes'),
		      		reposts : getRates(self.currentGroup().posts(),'reposts'),
		      		comments : getRates(self.currentGroup().posts(),'comments'),

	      		});

	      		self.LCRforCertainUsers({
			      	likes : getRates(self.postsForCertainUsersLCR(),'likes'),
		      		reposts : getRates(self.postsForCertainUsersLCR(),'reposts'),
		      		comments : getRates(self.postsForCertainUsersLCR(),'comments'),      			
	      		});
			
			self.certainUsersLCRForEachPost( getLCRForUsersFromGroup(self.certainUsers(),self.currentGroup().posts()));
	      	

	      	// console.log(self.certainUsers());	      

	      	}

	});


	self.computedLCR = ko.computed(function(){
		return { 
	      		likes : computedLCR(self.LCR()).likes + " (" + computedLCR(self.LCRforCertainUsers()).likes + ")" ,
	      		reposts : computedLCR(self.LCR()).reposts + " (" + computedLCR(self.LCRforCertainUsers()).reposts + ")" ,
	      		comments : computedLCR(self.LCR()).comments + " (" + computedLCR(self.LCRforCertainUsers()).comments + ")" ,

	      	};
	})

	self.getCertainUsers = ko.computed(function(){
		var coid = self.selectedCountry() ? +self.selectedCountry().id : 0,
			cid = self.selectedCity() ? +self.selectedCity().cid : 0;
		 	self.certainUsers(getUsersFromGroup(self.currentGroup(),coid,cid));
		return self.certainUsers().length;
	});


	self.getCitiesByCountry = ko.computed(function(){
		var id = self.selectedCountry() ? self.selectedCountry().id : 0;
		// console.log(self.currentGroup().citiesByCountry()[id]);
		if (id){
			return cityForSelect(self.currentGroup(),id);
		}
		
	});

	self.groupCheck = function(){

		self.currentGroup(new Group());

		membersGroups = [];
		countries = {};

		self.showChooseParams(false);
		self.showInfoGroup(false);
			// console.log(self.groupName())

		vkCall.groupGetById(self);

	}

	self.chooseParams = function(){
			var depth = +self.depth();
			if (depth > 0) vkCall.getWall(self,depth);
			else console.log("Укажите большую глубину")
		// console.log(self.currentGroup().country())

	}

	self.download = function(){
		var text = self.sortedList(),
			amountPeople = self.amountPeople();
		self.showSortedList(true);
		var res = "";
		text.slice(0,amountPeople).forEach(function(i){
			res+=i+" "
		})
		return res;
		// console.log(amountPeople)
		// window.open('data:text/plain;charset=utf-8,' + text.slice(0,amountPeople));
	}

	self.checkUser = function(){
		console.log(self.statusUser())
	}

	self.auth = function(){
		vkCall.auth(self);
	}

	vkCall.checkStatus(self);

}

// --------------- End View Model --------------------



// получаем информацию о группе и её участниках

function makeCountries(item,group){

	var countries = group.countries(),
		country = item['country'];
	if ( country && !countries[country['id']] )
		countries[country['id']] = country['title'];
}

function countryForSelect(group){
	var countries = group.countries();
	group.country((function(){
		var arr = [];
		for (var key in countries)
			arr.push({'id': key, 'countryName' : countries[key]})
		return arr.slice(0,20);
	})());
}

function cityForSelect(group,id){
	var cities = group.citiesByCountry()[id],
		arr = [];

	for (var i = 0; i < cities.length; i++){
		var cid = cities[i],
			cname = group.cities()[cid];
		arr.push({'cid' : cid, 'cname' : cname});	
	}
	group.city(arr);
	return group.city();
}

function makeCities(item, group){
	var city = item['city'],
		cities = group.cities(),
		citiesByCountry = group.citiesByCountry();

	if ( city && !cities[city['id']] ){
		cities[city['id']] = city['title'];
		var cbc = citiesByCountry[item['country']['id']];
		if (!cbc) citiesByCountry[item['country']['id']] = [city['id']];
		else citiesByCountry[item['country']['id']].push(city['id']);
	}
}

function makeUsers(user,group){
	var obj = {}
	user['sex'] ? obj['sex'] = user['sex'] : obj['sex'] = 0;
	user['city'] ? obj['city'] = user['city']['id'] : obj['city'] = 0;
	user['country'] ? obj['country'] = user['country']['id'] : obj['country'] = 0;
	user['bdate'] ? obj['bdate'] = user['bdate'] : obj['bdate'] = 0;
	obj['name'] = user['last_name'] + " " + user['first_name'];
	group.users()[user['id']] = obj;
}



// function authInfo(response) {
// 	console.log(response)

//   // id = response.session.mid;
//   // if (id) console.log("Авторизация прошла успешно " + id);
//   // else console.log("no")
// }

function getUsersFromGroup(group, coid, cid, sid){
	var sid = 0;
	var users = group.users();
	var result = [];

	if (coid === 0 && sid === 0) {
		Object.keys(users).forEach(function(i){
			result.push(+i);
		})
		return result;
	}
	else if (cid === 0 && coid !== 0 && sid !== 0){
		for (var i in users)
			if (users[i]['country'] === coid && users[i]['sex'] === sid ) result.push(+i);
	}
	else if (coid === 0 && sid !== 0){
		for (var i in users)
			if (users[i]['sex'] === sid ) result.push(+i);
	}
	else if (sid === 0 && cid === 0 && coid !== 0){
		for (var i in users)
			if (users[i]['country'] === coid ) result.push(+i);
	}
	else if (sid === 0 && coid !== 0 && cid !== 0){
		for (var i in users)
			if (users[i]['country'] === coid && users[i]['city'] === cid) result.push(+i);
	}
	else {
		for (var i in users)
			if (users[i]['country'] === coid && users[i]['city'] === cid 
				&& users[i]['sex'] === sid) result.push(+i);
	}
	return result;
}

function getRates(posts,str){
	// console.log(posts)
	var arr = [];
	for (var i in posts){
		posts[i][str].forEach(function(item){
			arr.push(item);
		});
	}
	return arr;
}

// Подсчитываем количество человек в каждой стране
function countPeopleByCountry(group ){
	for (var i in group.users()){
		var coid;
		if (group.users()[i]['country']) coid = group.users()[i]['country'];
		else coid = 0;
		if (group.peopleByCountry()[coid]) group.peopleByCountry()[coid] += 1;
		else group.peopleByCountry()[coid] = 1;		
	}
	return group.peopleByCountry();
}

function countPeople(group, goal){
	var list = {};
	for (var i in group.users()){
		var id;
		if (group.users()[i][goal]) id = group.users()[i][goal];
		else id = 0;
		if (list[id]) list[id] += 1;
		else list[id] = 1;		
	}
	return list;
}

// Подсчитываем количество человек в каждом городе
// function countPeopleByCity(group){
// 	for (var i in group.users()){
// 		var coid;
// 		if (group.users()[i]['country']) coid = group.users()[i]['country'];
// 		else coid = 0;
// 		if (group.peopleByCountry()[coid]) group.peopleByCountry()[coid] += 1;
// 		else group.peopleByCountry()[coid] = 1;		
// 	}
// 	return group.peopleByCountry();
// }

// Сортируем словарь {id: count} по колличеству
function sortDict(dict){
	return Object.keys(dict).sort(function(a,b){return dict[b]-dict[a]}); // массив id's ["1","0",...]
}

// Принимает на вход масссив с сортированными ключами и возвращает ответ в виде массива с объектами вида {id: 1, title: Russia, count: 100}
function list(keysSorted, group, goal){
	var arr = [];
	keysSorted.slice(0,6).forEach(function(key){
		if (+key !== 0) {
			if ( goal === "country"){
				arr.push({
					'id' : key,
					'title' : group.countries()[+key],
					'count': group.peopleByCountry()[key]
				});
			}
			else if ( goal === "city"){
				arr.push({
					'id' : key,
					'title' : group.cities()[+key],
					'count': group.peopleByCity()[key]
				});
			}
		}
	});
	return arr;
}

function checkIntersection(arr1,arr2){
  if (arr1 !== [] && arr2 !== [])
    return _.intersection(arr1,arr2);
}

function getPostsForCertainUsersLCR(usersFromGroup, posts){
  var u = {};
  for (var i in posts){
    u[i] = {};
    for (var j in posts[i]){
      u[i][j] = checkIntersection(usersFromGroup,posts[i][j]);
    }
  }
  // console.log(u);
  return u;
}

function computedLCR(LCR){
		return { 
	      		likes : LCR.likes.length,
	      		reposts : LCR.reposts.length,
	      		comments : LCR.comments.length,

	      	};
}

function getLCRForUsersFromGroup(users, posts){
  var usersLCR = {};
  for (var i = 0; i < users.length; i++){
    var u = users[i];
    usersLCR[u] = {};
    for(var j in posts){
      var p = posts[j],
          l = checkIntersection([u],p['likes']),
          r = checkIntersection([u],p['reposts']),
          c = checkIntersection([u],p['comments']),
          a = [];


      (l.length) ? a.push(1) : a.push(0);
      (c.length) ? a.push(1) : a.push(0);
      (r.length) ? a.push(1) : a.push(0);

      usersLCR[u][j] = a;
    }
  }
  // console.log(usersLCR);
  return usersLCR;
}

function countUsersFromGroupER(users){
  var usersER = {};
  function sum(arr){
    return arr.reduce(function(pv, cv) { return pv + cv; }, 0);
  }
  for (var i in users){
    usersER[i] = 0;
    for (var j in users[i]){
      usersER[i] += sum(users[i][j]);
    }
  }
  return usersER;
}

function sortByValue(dict){
  var sortArr = [];
  for (var key in dict)
    sortArr.push([key,dict[key]])
  return sortArr.sort(function(a, b) {return b[1] - a[1]})
}



ko.applyBindings(new ViewModel());