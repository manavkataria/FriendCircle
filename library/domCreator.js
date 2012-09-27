function clearFeedList() {
			feedContainer.innerHTML = "";
		}
function addFeed(uid, msg, name) {
  var imgHTML = "<img src='https://graph.facebook.com/" + uid + "/picture' class='thmb'/>";
  var msgHTML = "<div class='chat-message'>" + msg + "</div>";
  var personHTML = "<div class='chat-person'>" + name + "</div>";
  var finalHTML =  "<ul class='feedList'>" + imgHTML +
      "<div class='chat-bubble'>" + personHTML + 
                "<div class='chat-bubble-arrow-border'></div>" +
                 "<div class='chat-bubble-arrow'></div></div></ul>"
  var ele = document.createElement("div");
  ele.innerHTML = finalHTML;
  feedContainer.appendChild(ele);
  initFB();
}

function initFB() {
	
}
