
    var Debug = function() {
      var container;
      var list;
      return {
        initiate : function(id) {
          container = document.getElementById(id);
          list = document.createElement("ul");
          list.className = "debugList";
          var ele = document.createElement("li");
          ele.innerHTML = "Debugging Initiated";
          container.appendChild(list);
          list.appendChild(ele);
        },
        log : function(msg) {
          var ele = document.createElement("li");
          ele.innerHTML = msg;
          var elems = list.getElementsByTagName("li");
          list.insertBefore(ele, elems[0]);
        }
      };
    }();
    
    var Graph = function () {
      // Common Variables
      // Settings
      var container, width, height, graph, zoomLevel = 7, distanceMultiplier = 7;
      
      // State
      var centerPoint, otherPoints = [], friendCircles = [], circleCount = 4;
      var selectedFriendLevel = null, friendLevelClickHandlerFn = null;
      
      // Helpers
      var nextAngle = 0, lastDistance = 0, lastRank = 0, oppositeDone = true;
      
      // Common functions
      function initiateGraph(_container, _width, _height) {
        container = document.getElementById(_container);
        width = _width;
        height = _height;
        graph = Raphael(_container, _width, _height);
        
        createGraphControls();
       /* if(window.addEventListener) {
	  container.addEventListener('DOMMouseScroll', zoomControl, false);
        }
        container.onmousewheel = zoomControl;
       */
        createBackground();
      }
      function createGraphControls() {
        var zoomInBut = document.createElement("button");
        zoomInBut.innerHTML = "+";
        zoomInBut.onclick = zoomIn;
        
        var zoomOutBut = document.createElement("button");
        zoomOutBut.innerHTML = "-";
        zoomOutBut.onclick = zoomOut;
        
        var controlDiv = document.createElement("div");
        controlDiv.appendChild(zoomInBut);
        controlDiv.appendChild(zoomOutBut);
        container.appendChild(controlDiv);
      }
      function zoomIn() {
        if (zoomLevel < 15)
          zoomLevel++;
        redraw();
      }
      function zoomOut() {
        if (zoomLevel > 4)
          zoomLevel--;
        redraw();
      }
      
      function redraw() {
        // Reset draw variables
        nextAngle = 0;
        lastDistance = 0;
        lastRank = 0;
        oppositeDone = true;
        
        // Friend Circles
        for(var i = 0; i < friendCircles.length; i++) {
          friendCircles[i].attr("r", (circleCount - i) * (distanceMultiplier + 0.5) * zoomLevel);
        }
        
        // Personalities
        for(var i = 0; i < otherPoints.length; i++) {
          var distance = lastDistance;
          if (otherPoints[i].rank > lastRank) {
            distance += distanceMultiplier * zoomLevel;
          }
          var x = centerPoint.attr("cx") + distance * Math.sin(nextAngle*Math.PI/180);
          var y = centerPoint.attr("cy") - distance * Math.cos(nextAngle*Math.PI/180);
        
          otherPoints[i].connection.remove();
          otherPoints[i].connection = graph.path("M" + centerPoint.attr("cx") + " " +
              centerPoint.attr("cy") + "L" + x + " " + y);
          otherPoints[i].connection.attr({stroke:"#7f888f"});
          
          otherPoints[i].circle.attr("cx", x);
          otherPoints[i].circle.attr("cy", y);
          otherPoints[i].circle.attr("r", zoomLevel);
          otherPoints[i].circle.toFront();
        
          if (oppositeDone) {
            nextAngle += 33;
            oppositeDone = true;
          } else {
            nextAngle += 180;
            oppositeDone = true;
          }
          lastRank = otherPoints[i].rank;
          lastDistance = distance;
        }
        centerPoint.toFront();
      }
      
      function zoomControl(event) {
          var delta = 0;
          if (!event) event = window.event;
          // normalize the delta
          if (event.wheelDelta) {
              // IE and Opera
              delta = event.wheelDelta / 60;
          } else if (event.detail) {
              // W3C
              delta = -event.detail / 2;
          }
          Debug.log("Scroll " + delta);
      }
      
      function createBackground() {
        // First the background
        var rect = graph.rect(0,0, width, height);
        rect.attr({fill: "#26323e"});
        var ell = graph.ellipse(width/2, height/2, width/2, height/2);
        ell.attr({fill: "r(0.5,0.5)#41576c-#26323e", stroke:"none"});
      }
      
      function createCenter() {
        centerPoint = graph.circle(width/2, height/2, zoomLevel);
        centerPoint.attr({fill:"rgb(99, 132, 164)", stroke:"#ffffff"});
      }
        
      function addPointTheta(_rank, _theta, _name, _handles) {
        var distance = _rank * distanceMultiplier * zoomLevel;

        var x = centerPoint.attr("cx") + distance * Math.sin(_theta*Math.PI/180);
        var y = centerPoint.attr("cy") - distance * Math.cos(_theta*Math.PI/180);

        var connection = graph.path("M" + centerPoint.attr("cx") + " " +
            centerPoint.attr("cy") + "L" + x + " " + y);
        connection.attr({stroke:"#7f888f", opacity:0.1});

        var newPoint = graph.circle(x,y, zoomLevel);
        newPoint.attr({fill:"rgba(40,50,60,125)", stroke: "#828b90", title: _name });
        newPoint.hover(_handles.onHover);
        newPoint.mouseout(_handles.onMouseOut);
        newPoint.click(_handles.onClick);
        newPoint.index = otherPoints.length;
        newPoint.drag(function(dx, dy) {
          // Stepper function
          var newx = this.ox + dx;
          var newy = this.oy + dy;
          if ( newx > width) {
            newx = width;
          }
          if (newy > height) {
            newy = height;
          }
          if (newx < 0) {
            newx = 0;
          }
          if (newy < 0) {
            newy = 0;
          }

          this.attr("cx", newx);
          this.attr("cy", newy);
          otherPoints[this.index].connection.remove();
          otherPoints[this.index].connection = graph.path("M" + centerPoint.attr("cx") + " " +
            centerPoint.attr("cy") + "L" + (newx) + " " + (newy));
          otherPoints[this.index].connection.attr({stroke:"#7f888f", opacity: 0.1});
          this.toFront();
          }, function() {
            // On Drag Start
            this.ox = this.attr("cx");
            this.oy = this.attr("cy");
          }, function() {
            // On Drag End

            // Calculate new rank.
            var dx = this.attr("cx") - centerPoint.attr("cx");
            var dy = this.attr("cy") - centerPoint.attr("cy");
            var distanceFromCenter = Math.sqrt(dx*dx + dy*dy);
            var newRank = 1 + Math.floor(distanceFromCenter / ((distanceMultiplier + 0.5) * zoomLevel));
            otherPoints[this.index].rank = newRank;
            _handles.onDrag(newRank);
            friendLevelClickHandlerFn(selectedFriendLevel);
          });
        otherPoints.push({
            circle : newPoint,
            connection: connection,
            rank : _rank
          });

        lastRank = _rank;
        lastDistance = distance;
        centerPoint.toFront();
        return newPoint;
      }
        
      function addPoint(_rank, _handles) {
        var distance = lastDistance;
        if (_rank > lastRank) {
          distance += distanceMultiplier * zoomLevel;
        }
        
        var x = centerPoint.attr("cx") + distance * Math.sin(nextAngle*Math.PI/180);
        var y = centerPoint.attr("cy") - distance * Math.cos(nextAngle*Math.PI/180);
        
        var connection = graph.path("M" + centerPoint.attr("cx") + " " +
            centerPoint.attr("cy") + "L" + x + " " + y);
        connection.attr({stroke:"#7f888f", opacity:0.1});
        
        var newPoint = graph.circle(x,y, zoomLevel);
        newPoint.attr({fill:"rgba(40,50,60,125)", stroke: "#828b90"});
        newPoint.hover(_handles.onHover);
        newPoint.mouseout(_handles.onMouseOut);
        newPoint.click(_handles.onClick);
        newPoint.index = otherPoints.length;
        newPoint.drag(function(dx, dy) {
          // Stepper function
          var newx = this.ox + dx;
          var newy = this.oy + dy;
          if ( newx > width) {
            newx = width;
          }
          if (newy > height) {
            newy = height;
          }
          if (newx < 0) {
            newx = 0;
          }
          if (newy < 0) {
            newy = 0;
          }
          
          this.attr("cx", newx);
          this.attr("cy", newy);
          otherPoints[this.index].connection.remove();
          otherPoints[this.index].connection = graph.path("M" + centerPoint.attr("cx") + " " +
            centerPoint.attr("cy") + "L" + (newx) + " " + (newy));
          otherPoints[this.index].connection.attr({stroke:"#7f888f", opacity:0.1});
          this.toFront();
          }, function() {
            // On Drag Start
            this.ox = this.attr("cx");
            this.oy = this.attr("cy");
          }, function() {
            // On Drag End
            
            // Calculate new rank.
            var dx = this.attr("cx") - centerPoint.attr("cx");
            var dy = this.attr("cy") - centerPoint.attr("cy");
            var distanceFromCenter = Math.sqrt(dx*dx + dy*dy);
            var newRank = 1 + Math.floor(distanceFromCenter / ((distanceMultiplier + 0.5) * zoomLevel));
            otherPoints[this.index].rank = newRank;
            _handles.onDrag(newRank);
            friendLevelClickHandlerFn(selectedFriendLevel);
          });
        otherPoints.push({
            circle : newPoint,
            connection: connection,
            rank : _rank
          });
        
        if (oppositeDone) {
          nextAngle += 33;
          oppositeDone = true;
        } else {
          nextAngle += 180;
          oppositeDone = true;
        }
        lastRank = _rank;
        lastDistance = distance;
        centerPoint.toFront();
        return newPoint;
      }
      
      function drawFriendCircles(clickHandler) {
        friendLevelClickHandlerFn = clickHandler;
        for (var i = 0; i < circleCount; i++ ) {
          var friendCircle = graph.circle(centerPoint.attr("cx"),
                centerPoint.attr("cy"),
                (circleCount - i) * (distanceMultiplier + 0.5) * zoomLevel);
          friendCircle.attr({fill : "rgb(48, 64, 77)", stroke : "rgb(0,0,0)", opacity: 0.5});
          
	  friendCircle.hover(function() {
            this.animate({fill: "#4a637b"}, 500);
          });
          friendCircle.mouseout(function() {
            if (selectedFriendLevel == this.attr("r")/((distanceMultiplier+0.5)*zoomLevel)) {
              
            } else {
              this.animate({fill: "rgb(48, 64, 77)"}, 500);  
            }
          });
          friendCircle.click(function() {
            selectedFriendLevel = this.attr("r")/((distanceMultiplier+0.5)*zoomLevel);
            clickHandler(selectedFriendLevel);
          });
          friendCircles.push(friendCircle);
        }
        centerPoint.toFront();
      }
      
      // Return; Public Variables
      return {
        initiate : function(_container, _width, _height) {
          initiateGraph(_container, _width, _height);
        },
        createCenter : function(_clickHandle, _mouseOverHandle) {
          createCenter(); 
        },
        addPoint : function(_rank, _handles) {
          return addPoint(_rank, _handles);
        },
        drawFriendCircles: function(clickHandler) {
          drawFriendCircles(clickHandler);
        },
        addPointTheta : function (_rank, _theta, _name, _handles) {
            return addPointTheta(_rank, _theta, _name, _handles);
        }
      };
    }();
    
    var Personality = function() {
      var data;
      var point;
      var visible = true;
	  var status_message;

      function initiate(_data) {
        data = _data;
      }
      function onHoverHandler() {
        Debug.log("Hover " + data.name);
      }
      function onClickHandler() {
        Debug.log("Click " + data.name);
        clearFeedList();
      FB.api('/'+data.id+'/feed',function(response) {
	console.log(response);
       addFeed(data.id, response['data'][0]['story'],data.name); 
      });
//addFeed(data.id, "Will Load this person's data",data.name); 
      }
      function onMouseOutHandler() {
        Debug.log("MouseOut " + data.name);
      }
      function dragHandler(newRank) {
        data.rank = newRank;
      }
      function drawPoint() {
        point = Graph.addPoint(data.rank, {
                  onClick : onClickHandler,
                  onHover : onHoverHandler,
                  onMouseOut : onMouseOutHandler,
                  onDrag : dragHandler
          });
      }
      function drawPointTheta(theta) {
          point = Graph.addPointTheta(data.rank, theta,
          		data.name, {
                  onClick : onClickHandler,
                  onHover : onHoverHandler,
                  onMouseOut : onMouseOutHandler,
                  onDrag : dragHandler
          });
      }
      return {
        initiate : function(_data) {
          initiate(_data);
        },
        draw : function() {
          drawPoint();
        },
        getData : function() {
          return data;
        },
        getPoint : function() {
          return point;
        },
        setScore : function(newScore) {
            data.score = newScore;
        },
        setStatus : function(newScore) {
            data.status = newScore;
        },
        setGender : function(newScore) {
            data.gender = newScore;
        },
        setRank : function(newRank) {
            data.rank = newRank;
        },
        drawTheta : function(theta) {
            drawPointTheta(theta);
        },
        setVisible : function() {
            visible = true;
        },
        setInvisible : function() {
            visible = false;
        },
        isVisible : function() {
           return visible;
        }
      };
    };
    
    var Personalities = [];
    
    var friendCircleClickHandler = function(rank) {
      clearFeedList();
      for (var i = 0; i<Personalities.length; i++) {
        if (Personalities[i].isVisible()) {
            if (Personalities[i].getData().rank <= rank) {
              Personalities[i].getPoint().attr({fill: "rgba(60,70,80,125)", stroke: "#DDEEFF"});
              var data = Personalities[i].getData();
			  console.log("ClicleClickHandler Data("+i+"): " + JSON.stringify(data));
			
			  //retrieve friend's status message
			  /*
			var friend_status_message; 
			  FB.api('/'+data.id.toString()+'/feed', function(response) {
						console.log(response.data[0]);
		        			if (response.data.length > 0) {
							friend_status_message = response.data[0].story;
							addFeed(data.id, friend_status_message, data.name); 
			  				//Debug.log("Friend(" + data.name +") Status " + friend_status_message);
						}
			    });
			*/  
              addFeed(data.id, "Will Load this person's data ", data.name); 
              
            } else {
              Personalities[i].getPoint().attr({fill: "rgba(40,50,60,125)", stroke: "#828b90"});
            }
        }
      }
    }
