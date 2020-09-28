window.onload = function() {
  setUpDropdown();
  loadJSON(function(response) {
    window.statesData = JSON.parse(response);
  });
}

function stateChanged() {
  const selectObj = document.getElementById("state");
  const selectedState = selectObj.value;
  if (selectedState == "none") {
    return;
  }
  const stateInfo = window.statesData[selectedState];

  if (stateInfo["can_vote_by_mail"] == "true") {
    document.getElementById("mail-in").innerHTML = "&#9989; anyone can vote by mail!"
  } else if (stateInfo["can_vote_by_mail"] == "false") {
    document.getElementById("mail-in").innerHTML = "&#10060; you must have an excuse, such as being age 65 or older, sick or out of town on election day"
  } else {
    document.getElementById("mail-in").innerHTML = "&#10067; vote by mail " + stateInfo["can_vote_by_mail"]
  }

  if (stateInfo["ballot_req_deadline"] == "auto") {
    document.getElementById("auto-ballot").setAttribute("style", "display:block")
  } else {
    document.getElementById("auto-ballot").setAttribute("style", "display:none")
  }

  const datesMap = constructDatesMap(stateInfo);
  setUpProgressBarAndDates(datesMap);
  setUpLinks(stateInfo);
  document.getElementById("voting-info").setAttribute("style", "display:block") 
}

function loadJSON(callback) {   
  var xobj = new XMLHttpRequest();
  xobj.overrideMimeType("application/json");
  xobj.open('GET', 'data.json', true); 
  xobj.onreadystatechange = function () {
    if (xobj.readyState == 4 && xobj.status == "200") {
      callback(xobj.responseText);
    }
  };
  xobj.send(null);  
}

function makeDate(dateString) {
  var splitString = dateString.split("-").map(function(el) { return parseInt(el); });
  console.log(splitString)
  splitString[1] = splitString[1] - 1;
  console.log(splitString)
  return new Date(...splitString)
}

function constructDatesMap(stateInfo) {
  const msInDay = 8.64e7;
  const today = Date.now();
  const beginTime =  new Date(2020, 8, 20);
  const ballotSubmitDeadlines = stateInfo["ballot_submit_deadline"];

  const regDeadline = makeDate(stateInfo["reg_deadline"]);
  const ballotReqDeadline = stateInfo["ballot_req_deadline"] != "auto" ? makeDate(stateInfo["ballot_req_deadline"]) : null;
  const ballotPostmarkedDeadline = ballotSubmitDeadlines.hasOwnProperty("postmarked") ? makeDate(ballotSubmitDeadlines["postmarked"]) : null;
  const ballotReceivedDeadline = makeDate(ballotSubmitDeadlines["received"]) == "Invalid Date" ? ballotSubmitDeadlines["received"] : makeDate(ballotSubmitDeadlines["received"]);
  const electionDay = new Date(2020, 10, 03);

  const totalTime = typeof(ballotReceivedDeadline) == "object" ? ballotReceivedDeadline - beginTime : electionDay - beginTime

  let datesMap = new Map()
  datesMap.set('progressBar', {
    'position': 100*(Date.now() - beginTime) / totalTime
  }).set('reg', {
    'deadline': regDeadline,
    'days': Math.round((regDeadline - today) / msInDay),
    'position': 100*(regDeadline - beginTime) / totalTime,
    'iconPosition': 100*(regDeadline - beginTime) / totalTime
  }).set('ballotReq', {
    'deadline': ballotReqDeadline,
    'days': Math.round((ballotReqDeadline - today) / msInDay),
    'position': 100*(ballotReqDeadline - beginTime) / totalTime,
    'iconPosition': 100*(ballotReqDeadline - beginTime) / totalTime
  }).set('ballotPostmarked', {
    'deadline': ballotPostmarkedDeadline, 
    'days': Math.round((ballotPostmarkedDeadline - today) / msInDay),
    'position': 100*(ballotPostmarkedDeadline - beginTime) / totalTime,
    'iconPosition': 100*(ballotPostmarkedDeadline - beginTime) / totalTime
  }).set('ballotReceived', {
    'deadline': ballotReceivedDeadline,
    'days': Math.round((ballotReceivedDeadline - today) / msInDay),
    'position': 100*(ballotReceivedDeadline - beginTime) / totalTime,
    'iconPosition': 100*(ballotReceivedDeadline - beginTime) / totalTime
  }).set('election', {
    'deadline': electionDay,
    'days': Math.round((electionDay - today) / msInDay),
    'position': 100*(electionDay - beginTime) / totalTime,
    'iconPosition': 100*(electionDay - beginTime) / totalTime
  });

  return checkForCollisions(datesMap);
}

function checkForCollisions(datesMap) {
  const likelyCollisions = ['ballotReq', 'ballotReceived', 'election', 'ballotPostmarked'];

  while (likelyCollisions.length > 0) {
    var poppedField = likelyCollisions.pop();

    for (const idx in likelyCollisions) {
      const field = likelyCollisions[idx];
      let datesMapPoppedField = datesMap.get(poppedField);
      let datesMapField = datesMap.get(field);
      if (Math.abs(datesMapPoppedField['iconPosition'] - datesMapField['iconPosition']) < 5) {
        datesMapPoppedField['iconPosition'] += 3;
        datesMap.set(poppedField, datesMapPoppedField);

        datesMapField['iconPosition'] -= 3;
        datesMap.set(field, datesMapField);
      }
    }
  }
  return datesMap;
}

function setUpProgressBarAndDates(datesMap) {
  if (datesMap.get('ballotReq')['deadline'] != null) {
    document.getElementById("ballot-req-line").setAttribute("style", "left: " + datesMap.get('ballotReq')['position'] + "%")
    document.getElementById("ballot-req-icon").setAttribute("style", "margin-left: calc(" + datesMap.get('ballotReq')['iconPosition'] + "% - 10px)")
    document.getElementById("ballot-req").setAttribute("style", "display:block")
    document.getElementById("days-to-ballot").innerText = datesMap.get('ballotReq')['days']
    document.getElementById("ballot-deadline").innerText = datesMap.get('ballotReq')['deadline'].getMonth()+1 + "/" + datesMap.get('ballotReq')['deadline'].getDate()
  } else {
    document.getElementById("ballot-req-line").setAttribute("style", "display:none")
    document.getElementById("ballot-req-icon").setAttribute("style", "display:none")
    document.getElementById("ballot-req").setAttribute("style", "display:none")
  }

  if (datesMap.get('ballotPostmarked')['deadline'] != null) {
    document.getElementById("ballot-postmarked-line").setAttribute("style", "left: " + datesMap.get('ballotPostmarked')['position'] + "%");
    document.getElementById("ballot-postmarked-icon").setAttribute("style", "margin-left: calc(" + datesMap.get('ballotPostmarked')['iconPosition']+ "% - 10px)");
    document.getElementById("ballot-postmark").setAttribute("style", "display:block")
    document.getElementById("days-to-postmark").innerText = datesMap.get('ballotPostmarked')['days'];
    document.getElementById("ballot-postmarked-deadline").innerText = datesMap.get('ballotPostmarked')['deadline'].getMonth()+1 + "/" + datesMap.get('ballotPostmarked')['deadline'].getDate();
  } else {
    document.getElementById("ballot-postmarked-line").setAttribute("style", "display:none")
    document.getElementById("ballot-postmarked-icon").setAttribute("style", "display:none")
    document.getElementById("ballot-postmark").setAttribute("style", "display:none")
  }

  if (typeof(datesMap.get('ballotReceived')['deadline']) != "string") { //specific case for UT
    document.getElementById("ballot-received-line").setAttribute("style", "left: " + datesMap.get('ballotReceived')['position'] + "%")
    document.getElementById("ballot-received-icon").setAttribute("style", "margin-left: calc(" + datesMap.get('ballotReceived')['iconPosition'] + "% - 10px)")
    document.getElementById("days-to-submit").innerText = datesMap.get('ballotReceived')['days'] 
    document.getElementById("ballot-submit-deadline").innerText = datesMap.get('ballotReceived')['deadline'].getMonth()+1 + "/" +datesMap.get('ballotReceived')['deadline'].getDate()
  } else {
    const minDaysToReceived = datesMap.get('election')['days']
    const maxReceivedDate = new Date(2020, 10, 17)
    const maxDaysToReceived = Math.round((maxReceivedDate - Date.now()) / 8.64e7)
    document.getElementById("days-to-submit").innerText = minDaysToReceived + " - " + maxDaysToReceived
    document.getElementById("ballot-submit-deadline").innerText = datesMap.get('ballotReceived')['deadline'] 
  }

  document.getElementById("loaddiv").setAttribute("style", "width: " + datesMap.get('progressBar')['position'] + "%")
  document.getElementById("reg-line").setAttribute("style", "left: " + datesMap.get('reg')['position'] + "%")
  document.getElementById("reg-icon").setAttribute("style", "margin-left: calc(" + datesMap.get('reg')['iconPosition'] + "% - 10px")
  document.getElementById("election-day-line").setAttribute("style", "left: " + datesMap.get('election')['position'] + "%")
  document.getElementById("election-day-icon").setAttribute("style", "margin-left: calc(" + datesMap.get('election')['iconPosition'] + "% - 10px)")
 
  document.getElementById("days-to-reg").innerText = datesMap.get('reg')['days']
  document.getElementById("days-to-election").innerText = datesMap.get('election')['days'] 

  document.getElementById("reg-deadline").innerText = datesMap.get('reg')['deadline'].getMonth()+1 + "/" + datesMap.get('reg')['deadline'].getDate()
  document.getElementById("election-date").innerText = datesMap.get('election')['deadline'].getMonth()+1 + "/" +datesMap.get('election')['deadline'].getDate() 
}

function setUpLinks(stateInfo) {
  var regLink = document.createElement("a");
  regLink.href = stateInfo["reg_link"];
  regLink.innerText = "register to vote"
  var regLinkParent = document.getElementById("reg-link");
  regLinkParent.innerText = "";
  regLinkParent.appendChild(regLink);
  if (stateInfo["ballot_link"] != "none") {
    var applyLink = document.createElement("a");
    applyLink.href = stateInfo["ballot_link"];
    applyLink.innerText = "apply for a mail-in ballot"
    var applyLinkParent = document.getElementById("apply-link")
    applyLinkParent.innerText = "";
    applyLinkParent.appendChild(applyLink);
  }
}

function setUpDropdown() {
  var x, i, j, l, ll, selElmnt, a, b, c;
  /* Look for any elements with the class "custom-select": */
  x = document.getElementsByClassName("custom-select");
  l = x.length;
  for (i = 0; i < l; i++) {
      selElmnt = x[i].getElementsByTagName("select")[0];
      ll = selElmnt.length;
      /* For each element, create a new DIV that will act as the selected item: */
      a = document.createElement("DIV");
      a.setAttribute("class", "select-selected");
      a.innerHTML = selElmnt.options[selElmnt.selectedIndex].innerHTML;
      x[i].appendChild(a);
      /* For each element, create a new DIV that will contain the option list: */
      b = document.createElement("DIV");
      b.setAttribute("class", "select-items select-hide");
      for (j = 1; j < ll; j++) {
            /* For each option in the original select element,
             *     create a new DIV that will act as an option item: */
            c = document.createElement("option");
            c.innerHTML = selElmnt.options[j].innerHTML;
            c.value = selElmnt.options[j].value;
            c.addEventListener("click", function(e) {
                      /* When an item is clicked, update the original select box,
                       *         and the selected item: */
                      var y, i, k, s, h, sl, yl;
                      s = this.parentNode.parentNode.getElementsByTagName("select")[0];
                      sl = s.length;
                      h = this.parentNode.previousSibling;
                      for (i = 0; i < sl; i++) {
                                  if (s.options[i].innerHTML == this.innerHTML) {
                                                s.selectedIndex = i;
                                                h.innerHTML = this.innerHTML;
                                                y = this.parentNode.getElementsByClassName("same-as-selected");
                                                yl = y.length;
                                                for (k = 0; k < yl; k++) {
                                                                y[k].removeAttribute("class");
                                                              }
                                                this.setAttribute("class", "same-as-selected");
                                                break;
                                              }
                                }
                      h.click();
                      s.onchange();
                  });
            b.appendChild(c);
          }
      x[i].appendChild(b);
      a.addEventListener("click", function(e) {
            /* When the select box is clicked, close any other select boxes,
             *     and open/close the current select box: */
            e.stopPropagation();
            closeAllSelect(this);
            this.nextSibling.classList.toggle("select-hide");
            this.classList.toggle("select-arrow-active");
          });
  }

  function closeAllSelect(elmnt) {
      /* A function that will close all select boxes in the document,
       *   except the current select box: */
      var x, y, i, xl, yl, arrNo = [];
      x = document.getElementsByClassName("select-items");
      y = document.getElementsByClassName("select-selected");
      xl = x.length;
      yl = y.length;
      for (i = 0; i < yl; i++) {
            if (elmnt == y[i]) {
                    arrNo.push(i)
                  } else {
                          y[i].classList.remove("select-arrow-active");
                        }
          }
      for (i = 0; i < xl; i++) {
            if (arrNo.indexOf(i)) {
                    x[i].classList.add("select-hide");
                  }
          }
  }

  /* If the user clicks anywhere outside the select box,
   * then close all select boxes: */
  document.addEventListener("click", closeAllSelect);
}
