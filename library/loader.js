var photoTagLimit = 30;
var tagWithMe = 5;
var tagInMe = 5;
var feedComments = 1;
var feedPosts = 3;
var totalScore = 0;
var friends = {};

var Loader = {
    getFriends : function() {
       FB.api('/me/friends', function(response) {
			console.log(response);
           Debug.log("Friends Loaded.");
            for (var i = 0; i < response.data.length; i++) {
                var friend = Personality();
                friend.initiate({
                    rank: 1,
                    score: 0,
                    name: response.data[i].name,
                    id: response.data[i].id
                });

/* //Takes too long to load. You might want to do this later, asynchronously per circle.

		        FB.api(response.data[i].id.toString()+'/statuses'
		        function(response) {
						console.log(response);
		        		if (response.data.length > 0) {
							friend.status_message = response.data[0].message;
						}
				});
*/				
                var friend2 = {
                    name: response.data[i].name,
                    score: 0
                };

                friends[response.data[i].id] = friend2;
                Personalities.push(friend);
            }
           Debug.log("Number of Friends: " + Personalities.length);
           Loader.getFeeds();
       });
    },
    getFeeds: function() {
        var uid = FB._userID;
        FB.api('me/feed', function(response) {
            var to = [];
            var from = [];
            Debug.log("No. of Feeds: " + response.data.length);
            for (var i = 0; i < response.data.length; i++) {
                var feed = response.data[i];
                if (feed.from.id == uid) {
                    if ((feed.hasOwnProperty('comments')) && (feed.comments.hasOwnProperty('data'))) {
                        var comments = feed.comments.data;
                        for (var k = 0; k < comments.length; k++) {
                            var comment = comments[k];
                            var commentingUser = comment.from.id;
                            if (commentingUser != uid) {
                                from.push(comment.from.id);
                            }
                        }
                    }
                }
                else {
                    to.push(feed.from.id);
                }
            }
            Debug.log('People who commented on you: ' + from.length);
            Debug.log('People who commented for you: ' + to.length);
            //document.getElementById("output").innerHTML = JSON.stringify(response,null);
            for (var i = 0; i < from.length; i++) {
                if (from[i] in friends) {
                    friends[from[i]].score = friends[from[i]].score + feedComments;
                    totalScore += feedComments;
                }
            }
            for (var i = 0; i < to.length; i++) {
                if (to[i] in friends) {
                    friends[to[i]].score = friends[to[i]].score + feedPosts;
                    totalScore += feedPosts;
                }
            }
        });
        Loader.getResponders();
    },
    getResponders : function() {
       uid = FB._userID;
        FB.api(
        {
            method: 'fql.query',
            query: 'select fromid from comment where post_id in (select post_id from stream where source_id=' + uid + ')'
        },
        function(response) {
            Debug.log("Number of ethernal feeds " + response.length);
            for (var i = 0; i < response.length; i++) {
                if ((response[i] != null) && (response[i].fromid != "") && (response[i].fromid in friends)) {
                    friends[response[i].fromid].score += feedComments;
                    totalScore += feedComments;
                }
            }
            Debug.log("Total Score " + totalScore);
            Loader.getMyTaggedPhotos();
        });
    },
    getMyTaggedPhotos : function() {
    //List of People ids who were tagged with me
        var listOfTags = [];
        uid = FB._userID;
        FB.api('me/photos', function(response) {
            //	alert(JSON.stringify(response,null));
            //	document.getElementById("output").innerHTML = JSON.stringify(response,null);
            for (var i = 0; i < response.data.length; i++) {
                photo = response.data[i];
                var tagsInPhoto = [];
                for (var j = 0; j < photo.tags.data.length; j++) {
                    tag = photo.tags.data[j];
                    if (tag.id != uid) {
                        tagsInPhoto.push(tag.id);
                    }
                }
                if (tagsInPhoto.length <= photoTagLimit) {
                    for (var k = 0; k < tagsInPhoto.length; k++) {
                        listOfTags.push(tagsInPhoto[k]);
                    }
                }
            }
            Debug.log('Number of people ever tagged with you: ' + listOfTags.length)
            //	alert(JSON.stringify(listOfTags,null));
            for (var i = 0; i < listOfTags.length; i++) {
                if (listOfTags[i] in friends) {
                    friends[listOfTags[i]].score = friends[listOfTags[i]].score + tagWithMe;
                    totalScore += tagWithMe;
                }
            }
            Debug.log("Total Score " + totalScore);
        //   Loader.getPhotosByMe();
            moveFriendsToPersonality();
        });

    },
    getPhotosByMe : function() {
        //List of People ids who are in photos owned by me
        Debug.log("Entered getPhotosByMe");
        var uid = FB._userID;
        //alert(uid);
        var querys = 'SELECT subject FROM photo_tag WHERE pid in (SELECT pid FROM photo WHERE aid IN ( SELECT aid FROM album WHERE owner=' + uid + '))';
        //alert(querys);
        FB.api({
                method: 'fql.query',
                query: querys
            },
            function(response) {
                //var a = eval('(' + JSON.stringify(response,null) + ')');
                //alert(getInfo(response));
                Debug.log(JSON.stringify(response));
                
                Debug.log("Tag count in my albums " + response.length);
                for (var i = 0; i < response.length; i++) {
                    if ((response[i] != null) && (response[i].subject != "") && (response[i].subject in friends)) {
                        friends[response[i].subject].score += tagInMe;
                        totalScore += tagInMe;
                    }

                }
                Debug.log("Total Score " + totalScore);

        });
    },
    getStatusMessage : function(id) {
		var fb_response;
        FB.api(id.toString()+'/statuses',
        function(response) {
			console.log(response.data[0].message);
			fb_response=response;
//                           if (response[0].hasProperty("message")){
//            var d = response[0];
//            Personalities[id].setStatus(d.message);
             //   Debug.log(response[0].message);
//                         }
        });
		return fb_response;
    },
    getGender : function(id) {
        FB.api(
     //   {
   //         method: 'users.getStandardInfo',
 //           uid: Personalities[id].getData().id,
 //	uid: '1439689960',
  //          fields: 'sex'},
         '/'+Personalities[id].getData().id,
        function(response) {
            Personalities[id].setGender(response.gender);
//          Debug.log(response.gender);
        });
    }
}; 
var moveFriendsToPersonality = function() {
  for(var i = 0; i < Personalities.length; i++) {
      var pData = Personalities[i].getData();
      Personalities[i].setScore(friends[pData.id].score);
      //Loader.getStatusMessage(i);
     //Loader.getGender(i);
  }
//  Loader.getGender(5);
  // Sort Personalities, decreasing order.
  Personalities.sort(function(a,b) {
     var score1 = a.getData().score;
     var score2 = b.getData().score;
     if(score1 < score2) {
         return +1;
     } else if (score1 == score2) {
         return 0;
     } else {
         return -1;
     }
  });
  // Divide into 5 groups
  var high = Personalities[0].getData().score;
  var low = 0;
  var rankCounts = [0,0,0,0,0];
  for (i=0;i<Personalities.length; i++) {
      var thisScore = Personalities[i].getData().score;
      if (thisScore >= 0.75 * (high - low)) {
        Personalities[i].setRank(1);
        rankCounts[0] ++;
      } else if (thisScore >= 0.5 * (high - low)) {
          Personalities[i].setRank(2);
          rankCounts[1]++;
      } else if (thisScore >= 0.25 * (high - low)) {
          Personalities[i].setRank(3);
          rankCounts[2]++;
      } else if (thisScore > 0) {
          Personalities[i].setRank(4);
          rankCounts[3]++;
      } else {
          Personalities[i].setRank(5);
          rankCounts[4]++;
      }
  }
  Debug.log(JSON.stringify(rankCounts, null));

  var thisRankAngle=0, thisRankIndex=0, thisRank= 4;
  for (i=Personalities.length-1;i>=0; i--) {
    var comRank = Personalities[i].getData().rank;
    if (comRank > thisRank) {
        Personalities[i].setInvisible();
        continue;
    }
    if (comRank < thisRank) {
        thisRankAngle = 0;
        thisRankIndex = 0;
        thisRank = comRank;
    }
    Personalities[i].drawTheta(thisRankAngle);
    thisRankAngle += 360 / rankCounts[thisRank-1];
    thisRankIndex++;
  }
};
var initiateLoads = function() {
    // Get Friends
    Loader.getFriends();
};
