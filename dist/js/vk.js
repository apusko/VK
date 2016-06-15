;(function() { 

	vkCall = {};
	var membersGroups = [];

	function auth(viewModel){
		VK.Auth.login(function(response){
			if (response.session) getUserInfo(viewModel,response.session.mid)
		});
	}

	function checkStatus(viewModel){
		VK.Auth.getLoginStatus(function(response) { 
		  if (response.session) getUserInfo(viewModel,response.session.mid)
		  else viewModel.statusUser([false]);
		}); 
	}

	function getUserInfo(viewModel,id){
		VK.Api.call('users.get', {user_ids: id}, function(r){
			if (r.response) viewModel.statusUser([true,r.response[0]['first_name'],r.response[0]['last_name'],"https://vk.com/id"+id]);
		});
	}

	function groupGetById(self){
	  	VK.Api.call('groups.getById', {group_ids: [self.groupName()], fields: ["members_count","description"]}, function(r) { 
			if(r.response) {
				var data = r.response[0];
				self.currentGroup()
						.gid(-data["gid"])
						.name(data["name"])
						.countPeople(data['members_count'])
						.description(data['description']);

				self.showInfoGroup(true);
				getMembers(self.currentGroup(), self);
			}
	  	});		
	}

	function getMembers(group,viewModel) {

		var	group_id = -group.gid(),
			members_count = group.countPeople();


		var code =  'var members = []; members.push(API.groups.getMembers({"group_id": ' + group_id + ', "v": "5.27", "sort": "id_asc", "count": "1000", "offset": ' + membersGroups.length + ',"fields" : ["bdate","sex","country","city"]}).items);' // делаем первый запрос и создаем массив
				+	'var offset = 1000;' // это сдвиг по участникам группы
				+	'while (offset < 25000 && (offset + ' + membersGroups.length + ') < ' + members_count + ')' // пока не получили 25000 и не прошлись по всем участникам
				+	'{'
					+	'members.push(API.groups.getMembers({"group_id": ' + group_id + ', "v": "5.27", "sort": "id_asc", "count": "1000", "offset": (' + membersGroups.length + ' + offset),"fields" : ["bdate","sex","country","city"]}).items);' // сдвиг участников на offset + мощность массива
					+	'offset = offset + 1000;' // увеличиваем сдвиг на 1000
				+	'};'
				+	'return members;'; // вернуть массив members

		VK.Api.call("execute", {code: code}, function(data){
			if (data.response){
				for (var i=0; i<data.response.length; i++)
					membersGroups = membersGroups.concat(data.response[i]);

				if (members_count >  membersGroups.length) {
					// console.log(data)
					console.log(membersGroups.length)
					setTimeout(function() { vkCall.getMembers(group,viewModel); }, 333); // задержка 0.333 с. после чего запустим еще раз
				}
				else { 	
					group.countries({}).country(null);
					// console.log(group.countries());
					console.log(membersGroups)
					membersGroups.forEach(function(item){
						makeCountries(item, group);
						countryForSelect(group);
						makeCities(item, group);
						makeUsers(item, group);

						// console.log(group.users());
					});

					console.log(group.cities(),"\n",group.citiesByCountry());

					group.peopleByCountry(countPeople(group,'country'));
					viewModel.listCountries(list(sortDict(group.peopleByCountry()),group, "country"));

					group.peopleByCity(countPeople(group,'city'));
					viewModel.listCities(list(sortDict(group.peopleByCity()),group, "city"));

					console.log(viewModel.listCities())
					// console.log(countPeople(group,'country'))

					// alert('Ура тест закончен! В массиве membersGroups теперь ' + membersGroups.length + ' элементов.');
					membersGroups = [];

				}
			}
		});	

	}

	function getWall(viewModel,amountPosts){
		var group = viewModel.currentGroup(),
			gid = group.gid(),
			posts = group.posts();

	  var code =  'var p = [];'
		  + 'var offset = 0;'
		  + 'var amountPosts = '+ amountPosts +';'
		  + 'var count = 100;'
		  + 'if (amountPosts < count) count = amountPosts;'
		  + 'var c = API.wall.get({"owner_id": ' + gid + ', "filter": "all"})[0];'
		  + 'if (amountPosts > c) { amountPosts = c; }'
		  + 'while (offset < 2400 && offset < amountPosts)' 
		  + '{'
			+ 'p.push(API.wall.get({"owner_id": ' + gid + ', "count": count, "offset": offset , "filter": "all"}));'
			+ 'offset = offset + 100;'
			+ 'if ( (offset + 100) > amountPosts)'
			+ '{'
			+   'count = amountPosts - offset;'
			+ '}' 
		  + '};'
		  + 'return p;';

	  VK.Api.call("execute", {code: code}, function(data) {
		if (data.response){
		  var dr = data.response,
			  arrPosts = [];
		  for (var i = 0; i < dr.length; i++ ){
			arrPosts = arrPosts.concat(dr[i].slice(1))
		  }
		  
		  var pids = [];

		  for (var i = 0; i < arrPosts.length; i++) {
			pids.push(arrPosts[i]['id']);
			posts[pids[i]] = {"date":arrPosts[i]['date']};
		  }

		  // console.log(posts)
		  getLikesFromPost(pids,0,24,gid,posts,viewModel);     // Методы Comments и Reposts вызываются внутри Likes 

		}
		}); 
	}

	function getLikesFromPost(pids,s,e,gid,posts,viewModel){
	  if (e > pids.length) e = pids.length;
	  var p = pids.slice(s,e);
	  // console.log(p)
	  var code = 'var likes = [];'
	            + "var pids = [" + p +"];"
	            + 'var i = 0;'
	            + 'while(i < 24)'
	            + '{'
	            + 'likes.push(API.likes.getList({"owner_id" : '+ gid + ', "type" : "post", "item_id" : pids[i],"count":1000}));'
	            + 'i = i + 1;'
	            + '};'
	            + 'return likes;';

	  VK.Api.call("execute", {code: code}, function(data) {
	    if (data.response){
	      var dr = data.response;
	      // console.log(dr)
	      for (var i = 0; i < p.length; i++){
	        if (!posts[p[i]]) posts[p[i]] = {}; 
	        posts[p[i]]['likes'] = dr[i]['users'];
	      }

	      	// console.log(posts)

	      if ( pids.length >  e) 
	        setTimeout(function() { getLikesFromPost(pids,s+24,e+24,gid,posts, viewModel) }, 333); 
	      else {
	      	// console.log(posts)
	      	// console.log('likes loaded')
			viewModel.LCRLoaded([true,false,false]);
	        getRepostsFromPost(pids,0,24,gid,posts, viewModel);
	      }
	    }
	  }); 
	}


	function getRepostsFromPost(pids,s,e,gid,posts, viewModel){
	  if (e > pids.length) e = pids.length;
	  var p = pids.slice(s,e);
	  var code = 'var reposts = [];'
	            + "var pids = [" + p +"];"
	            + 'var i = 0;'
	            + 'while(i < 24)'
	            + '{'
	            + 'reposts.push(API.wall.getReposts({"owner_id" : '+ gid + ', "post_id" : pids[i], "count" : 1000}));'
	            + 'i = i + 1;'
	            + '};'
	            + 'return reposts;';

	  VK.Api.call("execute", {code: code}, function(data) {
	    if (data.response){
	      var dr = data.response;
	      for (var i = 0; i < p.length; i++){
	        if (!posts[p[i]]) posts[p[i]] = {};     
	        if (!posts[p[i]]['reposts']) posts[p[i]]['reposts'] = [];
	        dr[i]['profiles'].forEach(function(item){
	          // if (item['uid'] !== id) 
	          posts[p[i]]['reposts'].push(item['uid'])
	        });
	      }

	      if ( pids.length >  e) 
	        setTimeout(function() { getRepostsFromPost(pids,s+24,e+24,gid,posts,viewModel) }, 333); 
	      else {      
	      	console.log('reposts loaded')
	      	// console.log(posts);

			viewModel.LCRLoaded([true,true,false]);
	        getCommentsFromPost(pids,0,24,gid,posts, viewModel);
	      }
	    }
	  }); 
	}

	function getCommentsFromPost(pids,s,e,gid,posts, viewModel){
	  if (e > pids.length) e = pids.length;
	  var p = pids.slice(s,e);
	  var code = 'var comments = [];'
	            + "var pids = [" + p +"];"
	            + 'var i = 0;'
	            + 'while(i < 24)'
	            + '{'
	            + 'comments.push(API.wall.getComments({"owner_id" : '+ gid + ', "post_id" : pids[i], "filter" : "all", "count" : 100}));'
	            + 'i = i + 1;'
	            + '};'
	            + 'return comments;';

	  	code = 	'var comments = [];'
	            + "var pids = [" + p +"];"
	            + 'var i = 0;'
	            + 'while(i < 24)'
	            + '{'
	            + 'comments.push(API.wall.getComments({"owner_id" : '+ gid + ', "post_id" : pids[i], "filter" : "all", "count" : 100}));'
	            + 'i = i + 1;'
	            + '};'
	            + 'return comments;';

	  VK.Api.call("execute", {code: code}, function(data) {
	    if (data.response){
	      var dr = data.response;
	      console.log(dr)
	      for (var i = 0; i < p.length; i++){
	      	console.log(p[i])
	        if (!posts[p[i]]) posts[p[i]] = {};     
	        if (!posts[p[i]]['comments']) posts[p[i]]['comments'] = [];
	        console.log(posts);
	        dr[i].slice(1).forEach(function(item){
	           // if (item['uid'] !== id)
	           posts[p[i]]['comments'].push(item['uid'])
	        });
	      }
	      // if ( dr[i] ) {};
	      if ( pids.length >  e) 
	        setTimeout(function() { getCommentsFromPost(pids,s+24,e+24,gid,posts, viewModel) }, 333); 
	      else {      
	      	console.log('comments loaded',posts)
	      	

			viewModel.LCRLoaded([true,true,true]);
			viewModel.showChooseParams(true);


	      }      


	    }
	  }); 
	}

	vkCall.getMembers = getMembers;
	vkCall.getWall = getWall;
	vkCall.groupGetById = groupGetById;
	vkCall.checkStatus = checkStatus;
	vkCall.auth = auth;
	window.vkCall = vkCall;

}());

