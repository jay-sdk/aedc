

//Set our margins
var margin = {
    top: 80,
    right: 180,
    bottom: 185,
    left: 60
}, width = 800 - margin.left - margin.right,
    height = 750 - margin.top - margin.bottom;

var MAP_DEFAULT = "control";
var MAP_POPULATION = "population";
var MAP_INFLUENCE = "inf";
var MAP_STATES = "states";
var MAP_DANGERSPOT = "danger";
var mapview = MAP_DEFAULT;

//base url: update this to correct path
var t_baseURL = ""; // http://aedc.etc.
//default; update from tracker faction dropdown onChange
var selectedFaction = "Wolf 406 Transport & Co";
//var selectedFaction = "LHS 2541 Alliance Combine";

var selectBox = d3.select("#js_faction");
/*selectBox = document.getElementById("js_faction");*/
/*selectBox.onchange = "setFaction(this.options[this.selectedIndex].value);"*/
/*selectBox.attr("onChange", "setFaction(this.options[this.selectedIndex].value);");*/

// Add our chart to the document body
var svg = d3.select("#map").append("svg")
    .attr("id", "wt_map")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

//background color
svg.append("rect")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("fill", "#f1fdfd")

//add a placeholder for the legend: content will change from view to view
svg.append("g")
    .attr("class", "legend")
    .attr("transform", "translate(" + (width + margin.left + 20) + "," + (height/2 + margin.top/2) + ")");

var descr = svg.append("g")
    .attr("class", "map_description")
    .attr("transform", "translate(" + (margin.left) + "," + (height + margin.top + 20) + ")");
descr.append("rect")
        .attr("width", width + (margin.right/2))
        .attr("height", 1.5)
        .style("fill", "#0E6D74");
descr.append("g")
        .attr("class", "map_description_content");

//buttons
var buttons = svg.append("g")
    .attr("id", "mapbuttons")
    .attr("transform", "translate(" + (width + margin.left + 30) + "," + margin.top + ")");

var mapbuttons = [
    {"text": "Control",
     "callback": "updateMap(MAP_DEFAULT);",
    },
    {"text": "Population",
     "callback": "updateMap(MAP_POPULATION);"
    },
    {"text": "Influence",
     "callback": "updateMap(MAP_INFLUENCE);"
    },
    {"text": "States",
     "callback": "updateMap(MAP_STATES);"
    },
    {"text": "Hot Spots",
     "callback": "updateMap(MAP_DANGERSPOT);"} 
];

for(var i =0; i < mapbuttons.length; i++){
    buttons.append("rect")
        .attr("rx", 3)
        .attr("ry", 3)
        .attr("y", i * 35)
        .attr("width", 120)
        .attr("height", 25)
        .attr("onmouseover", "this.style.fill=\"#1cd6e3\";")
        .attr("onmouseout", "this.style.fill=\"white\";")
        .attr("onclick", mapbuttons[i].callback)
        .style("stroke", "#0E6D74")
        .style("stroke-width", 2)
        .style("fill", "white");
    buttons.append("text")
        .attr("x", 60)
        .attr("y", (i * 35) + 17)
        .attr("text-anchor", "middle")
        .text(mapbuttons[i].text)
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .style("fill", "#0E6D74")
        .style("opacity", 1.0);
}

svg.append("text")
    .attr("id", "maptitle")
    .attr("x", (width + margin.left + margin.right)/2)
    .attr("y", 28)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .style("fill", "#0E6D74");


//main map content
svg = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


var x_scale = d3.scale.linear()
    .range([0, width-20]);

var y_scale = d3.scale.linear()
    .range([height-20, 0]);

//used as a color gradient for influence visualization
var inf_scale = d3.scale.linear()
    .domain([4,40,90])
    .range(["red", "green", "lime"]);

var pop_logscale = d3.scale.log()
    .domain([1000,1000000000000])
    .range([8, 90]);

var statecolors = {
    "War": "red",
    "Civil War": "crimson",
    "Election": "lightcoral",
    "Lockdown": "#202020",
    "Civil Unrest": "#404040",
    "Outbreak": "gold",
    "Famine": "yellow",
    "Boom": "green",
    "Bust": "olive",
    "Expansion": "dodgerblue",
    "Retreat": "skyblue",
    "None": "white"
};

var stateorder = Object.keys(statecolors);

var _mapdata = {};

var dangerscale = d3.scale.linear()
    .domain([0,1,5,10,70])
    .range(["darkred", "red", "orange", "gold", "green"]);

createMap(selectedFaction);

function createMap(selectedFaction){
    var str;
    str = selectedFaction.replace(/ /g, "+");
    str = str.replace(/&/g, "%26");
    d3.json("/aedc?in_page=100&in_select0=" + str, function(error, mapdata) {
        
    //build the URL to the right faction: base URL + faction, with white spaces replaced with '+'
    //d3.json(t_baseURL + selectedFaction.replace(/ /g, "+"), function(error, mapdata) {
        
        //clear anything already there
        svg.selectAll(".system").remove();

        //console.log(mapdata);
        _mapdata = mapdata;
        mapdata = mapdata.systems;
        
        x_scale.domain([d3.min(mapdata, function(d){  return +d.x; }), d3.max(mapdata, function(d){  return +d.x; })]);

        y_scale.domain([d3.min(mapdata, function(d){  return +d.y; }), d3.max(mapdata, function(d){  return +d.y; })]);

        var systems = svg.selectAll("system")
         .data(mapdata);

        // main system group
        var systemsEnter = systems.enter()
            .append("g")
            .attr("class", "system")
            .attr("id", function(d){ return "_" + d.name.replace(/ /g, "_"); })
            //.on("mouseover", function(){
            //    this.parentNode.appendChild(this);
            //})
            .attr("transform", function(d){ return "translate(" + x_scale(+d.x) + "," + y_scale(+d.y) +  ")"} );
        
        // create the state rings: should be drawn first to be below the main star circle
        // opacity = 0, initially
        for(var i=8; i > 0; i--){
            systemsEnter.append("circle")
                .attr("class", "staterings")
                .attr("id", function(d) { return "_" + d.name.replace(/ /g, "_") + "_statering_" + i;})
                .attr("r", 12+ (i*4))
                .style("opacity", 0.0);
        }

        //population rings
        var star = systemsEnter.append("circle")
            .attr("class", "population")
            .attr("r", function(d){
                return pop_logscale(+d.population);
            })
            .style("fill", "#0E6D74")
            .style("opacity", 0.0);


        // main star circle
        var star = systemsEnter.append("circle")
            .attr("class", "star")
            .attr("r", "9")
            .style("stroke-width", "3");


        // star label; first the white drop shadow (useful for pop and states maps)
        systemsEnter.append("text")
            .attr("class", "starlabel")
            .attr("dy", "2.1em")
            .attr("text-anchor", "middle")
            .text(function(d) { return d.name; })
            .style("stroke", "white")
            .style("stroke-width", "1.1px")
            .style("font-weight", "bold")
            .style("opacity", 0.8);

        //then the main label
        systemsEnter.append("text")
            .attr("class", "starlabel")
            .attr("dy", "2.1em")
            .attr("text-anchor", "middle")
            .text(function(d) { return d.name; })
            .style("font-weight", "bold")
            .style("opacity", 1);

        updateMap(mapview);

    } ); 
}

function updateMap(view){
    
    var stateringIndex = 1;
    
    var svg = d3.select("svg#wt_map");
    var title = svg.select("#maptitle");
    svg.selectAll(".staterings")
        .style("opacity", 0.0);
    
    svg.selectAll(".population")
        .style("opacity", 0.0);
    
    var legend = svg.selectAll(".legend");
    legend.selectAll("*").remove();
    var legend = legend.append("g")
        .attr("transform", "translate(50,20)");
    
    var desc = svg.selectAll(".map_description_content");
    desc.selectAll("*").remove();
    
    svg = svg.selectAll(".system")
    
    mapdata = _mapdata;
    svg.data(mapdata.systems).enter();
        switch(view){
            // control
            case MAP_DEFAULT:
                //show control: Y = fill with color, N means don't
                svg.select(".star")
                    .style("stroke", "#0E6D74")
                    .style("fill", function(d){ 
                        return (selectedFactionIsRuler(d.factions, selectedFaction) === "Y" ? "#0E6D74" :         "white"); });

                //legend
                legend.append("circle")
                    .attr("r", "9")
                    .style("stroke-width", "3")
                    .style("stroke", "#0E6D74")
                    .style("fill", "#0E6D74");

                legend.append("text")
                    .attr("x", 20)
                    .attr("dy", "0.4em")
                    .attr("text-anchor", "start")
                    .text("Controlled")
                    .style("font-size", "10px");

                legend.append("circle")
                    .attr("cy", 30)
                    .attr("r", "9")
                    .style("stroke-width", "3")
                    .style("stroke", "#0E6D74")
                    .style("fill", "white");

                legend.append("text")
                    .attr("x", 20)
                    .attr("y", 34)
                    .attr("text-anchor", "start")
                    .text("Expanded")
                    .style("font-size", "10px");
                
                title.text("Controlled and Expanded Systems for " + selectedFaction);


                break;
            // influence
            case MAP_INFLUENCE:
                //show influence as a gradient in the fill; control in the stroke
                svg.select(".star")
                    .style("stroke", function(d){ 
                        return (selectedFactionIsRuler(d.factions, selectedFaction) === "Y" ? "green" : "maroon"); })
                    .style("fill", function(d){ return inf_scale(factionInfluence(d.factions, selectedFaction)); });
                
                //description content
                var infdata = [];
                mapdata.systems.forEach(function(d){
                    var inf = 0;
                    var sysinf = {name:  d.name ,value:  factionInfluence(d.factions, selectedFaction).toFixed(1)};
                    infdata.push(sysinf);
                });
                
                if(infdata.length > 20){
                    setDescription(desc,infdata, 8, 190, 160, "end");
                }else{
                    setDescription(desc,infdata, 5, 190, 160, "end");
                }
                
                
                
                //legend
                for(i=0; i< 21; i++){
                    legend.append("rect")
                        .attr("y", i * 3)
                        .attr("height", 3)
                        .attr("width", 10)
                        .style("fill", inf_scale(i * 5));
                }
                for(i = 0; i < 3; i++){
                    legend.append("text")
                        .attr("x", 15)
                        .attr("y", (i * 30) + 4)
                        .attr("text-anchor", "start")
                        .text((i * 50) + "%" )
                        .style("font-size", "10px");
                }
                legend.append("circle")
                    .attr("cy", 85)
                    .attr("r", "9")
                    .style("stroke-width", "3")
                    .style("stroke", "green")
                    .style("fill", "white");

                legend.append("text")
                    .attr("x", 15)
                    .attr("y", 87)
                    .attr("text-anchor", "start")
                    .text("Controlled")
                    .style("font-size", "10px");

                legend.append("circle")
                    .attr("cy", 110)
                    .attr("r", "9")
                    .style("stroke-width", "3")
                    .style("stroke", "maroon")
                    .style("fill", "white");

                legend.append("text")
                    .attr("dx", 15)
                    .attr("y", 112)
                    .attr("text-anchor", "start")
                    .text("Expanded")
                    .style("font-size", "10px");

                title.text("Influence for " + selectedFaction + " Systems");

                break;
            // states
            case MAP_STATES:
                // fill increasing outer rings with states info
                fillStateRings(svg, mapdata.systems, selectedFaction);
                // fill main star systems
                svg.select(".star")
                    .style("stroke", "#E0E0E0")
                    .style("fill", function(d){ return selectedFactionStateColor(d.factions, selectedFaction); });
                
                
                var activestate = [];
                mapdata.systems.forEach(function(elem){
                    var statesys = elem.name;
                    var sysfacs = elem.factions;
                    sysfacs.forEach(function(f){
                        if(f.faction === selectedFaction){
                            if(activestate.indexOf(f.state)=== -1){
                                activestate.push({system: statesys, state: f.state});
                            }
                        }
                    })
                    
                });
                console.log(activestate);
                var conflictstate = activestate.filter(function(d){
                    //console.log(d);
                    return ["War", "Civil War", "Election"].indexOf(d.state) !== -1;
                });
                //console.log(conflictstate);
                
                var factstate = activestate.filter(function(d){
                    //console.log(d);
                    return ["War", "Civil War", "Election"].indexOf(d.state) === -1;
                });
                //console.log(factstate);
                
                //little logic to handle multiple non-conflict states in case data has not been updated fully
                var lookup = {};
                for(var item, i=0; item = factstate[i++];){
                    var state = item.state;
                    
                    if(!(state in lookup)){
                        lookup[state] = 1;
                    } else {
                        lookup[state] = lookup[state] + 1;
                    }
                }
                //console.log(lookup);
                var factdesc = [];
                var statemsg = "";
                var nonconfstates = Object.keys(lookup);
                if(nonconfstates.length > 1){
                    var _msg = [];
                    for(var i=0; i<nonconfstates.length; i++){
                        _msg.push(nonconfstates[i] + " (" + lookup[nonconfstates[i]] + ")");
                    }
                    _msg.push("Check tracker whether all data has been updated (correctly). There should be only one state");
                    statemsg = _msg.join(", ")
                }else{
                    statemsg = nonconfstates[0];
                }
                var factstatemsg = {name: "Active Faction State:", value: statemsg};
                factdesc.push(factstatemsg);
                //war state, if any
                if(conflictstate.length === 1){
                    statemsg = conflictstate[0].state + " in " + conflictstate[0].system;    
                }
                if(conflictstate.length > 1){
                    _statemsg = "Likely data error. Multiple conflicts recorded";
                }
                factstatemsg = {name: "Active Conflict:", value: statemsg};
                factdesc.push(factstatemsg)
                setDescription(desc,factdesc, 5, 190, 120, "start");
                
                for(var i = 0; i < stateorder.length; i++){
                    legend.append("rect")
                        .attr("y", i * 12)
                        .attr("width",10)
                        .attr("height", 7)
                        .style("fill", statecolors[stateorder[i]]);

                    legend.append("text")
                        .attr("x", "15")
                        .attr("y", (i * 12) +6)
                        .attr("text-anchor", "start")
                        .text(stateorder[i])
                        .style("font-size", "10px");

                }

                title.text("Active States in " + selectedFaction + " Systems");

                break;

            case MAP_DANGERSPOT:
                svg.select(".star")
                    .style("stroke", function(d){ 
                        return (selectedFactionIsRuler(d.factions, selectedFaction) === "Y" ? "green" : "maroon"); })
                    .style("fill", function(d){ return dangerscale(calculateMargin(d.factions, selectedFaction)); });
                
                //description content
                var margindata = [];
                mapdata.systems.forEach(function(d){
                    var inf = 0;
                    var sysmargin = {name:  d.name ,value:  (calculateMargin(d.factions, selectedFaction)).toFixed(1)};
                    margindata.push(sysmargin);
                });
                
                if(margindata.length > 20){
                    setDescription(desc,margindata, 8, 190, 160, "end");
                }else{
                    setDescription(desc,margindata, 5, 190, 160, "end");
                }

                for(i=0; i< 21; i++){
                    legend.append("rect")
                        .attr("y", i * 3)
                        .attr("height", 3)
                        .attr("width", 10)
                        .style("fill", dangerscale(i * 2.5));
                }
                for(i = 0; i < 3; i++){
                    legend.append("text")
                        .attr("x", 15)
                        .attr("y", (i * 30) + 4)
                        .attr("text-anchor", "start")
                        .text((i * 25) + "%" )
                        .style("font-size", "10px");
                }
                legend.append("circle")
                    .attr("cy", 85)
                    .attr("r", "9")
                    .style("stroke-width", "3")
                    .style("stroke", "green")
                    .style("fill", "white");

                legend.append("text")
                    .attr("x", 15)
                    .attr("y", 87)
                    .attr("text-anchor", "start")
                    .text("Controlled")
                    .style("font-size", "10px");

                legend.append("circle")
                    .attr("cy", 110)
                    .attr("r", "9")
                    .style("stroke-width", "3")
                    .style("stroke", "maroon")
                    .style("fill", "white");

                legend.append("text")
                    .attr("dx", 15)
                    .attr("y", 112)
                    .attr("text-anchor", "start")
                    .text("Expanded")
                    .style("font-size", "10px");
                
                title.text(selectedFaction + " Hot Spots (margin to closest neighbour)");

                break;

            case MAP_POPULATION:
                svg.selectAll(".population")
                .style("opacity", 0.4);
                //and ensure the base map is set right
                //show control: Y = fill with color, N means don't
                svg.select(".star")
                    .style("stroke", "#0E6D74")
                    .style("fill", function(d){ 
                        return (selectedFactionIsRuler(d.factions, selectedFaction) === "Y" ? "#0E6D74" :         "white"); });
                
                //description content
                var popdata = [];
                mapdata.systems.forEach(function(d){
                    var popshort = "";
                    if(d.population > 1000000000){
                        popshort = (d.population/1000000000).toFixed(2) + "B";
                    }else if(d.population > 1000000){
                        popshort = (d.population/1000000).toFixed(2) + "M";
                    }else{
                        popshort = (d.population/1000).toFixed(2) + "K";
                    }
                    console.log(popshort);
                    var syspop = {name:  d.name ,value:  popshort};
                    popdata.push(syspop);
                });
                
                if(popdata.length > 20){
                    setDescription(desc,popdata, 8, 190, 160, "end");
                }else{
                    setDescription(desc,popdata, 5, 190, 160, "end");
                }
                

                //legend
                legend.append("circle")
                    .attr("cx", 20)
                    .attr("r", pop_logscale(1000))
                    .style("stroke", "#0E6D74")
                    .style("fill", "#0E6D74")
                    .style("opacity", 0.4);

                legend.append("text")
                    .attr("x", 20)
                    .attr("y", 2)
                    .attr("text-anchor", "middle")
                    .text("1000")
                    .style("font-size", "10px");

                legend.append("circle")
                    .attr("cx", 20)
                    .attr("cy", 40)
                    .attr("r", pop_logscale(100000))
                    .style("stroke", "#0E6D74")
                    .style("fill", "#0E6D74")
                    .style("opacity", 0.4);

                legend.append("text")
                    .attr("x", 20)
                    .attr("y", 42)
                    .attr("text-anchor", "middle")
                    .text("100,000")
                    .style("font-size", "10px");

                legend.append("circle")
                    .attr("cx", 20)
                    .attr("cy", 115)
                    .attr("r", pop_logscale(10000000))
                    .style("stroke", "#0E6D74")
                    .style("fill", "#0E6D74")
                    .style("opacity", 0.4);

                legend.append("text")
                    .attr("x", 20)
                    .attr("y", 117)
                    .attr("text-anchor", "middle")
                    .text("10,000,000")
                    .style("font-size", "10px");
                
                legend.append("circle")
                    .attr("cx", 20)
                    .attr("cy", 225)
                    .attr("r", pop_logscale(1000000000))
                    .style("stroke", "#0E6D74")
                    .style("fill", "#0E6D74")
                    .style("opacity", 0.4);

                legend.append("text")
                    .attr("x", 20)
                    .attr("y", 227)
                    .attr("text-anchor", "middle")
                    .text("1,000,000,000")
                    .style("font-size", "10px");

                title.text("Population sizes for " + selectedFaction + " Systems");
                break;

        }
}

function selectedFactionIsRuler(data, faction){
    var ruler = "N";
    try{
        data.some(function (d){ 
            if(d.faction === faction){ 
                ruler = d.ruler}});
    }catch(e){
        if(e.name !== "TypeError"){
            throw e;
        }
    }
    return ruler;
}

function factionInfluence(data, faction){
    var inf = -1;
    try{
        data.some(function (d){ 
            if(d.faction === faction){ 
                inf = d.inf}});
    }catch(e){
        if(e.name !== "TypeError"){
            throw e;
        }
    }
    return inf;
}

function selectedFactionStateColor(data, faction){
    
    return statecolors[getFactionState(data, faction)];
}

function fillStateRings(svg, data, faction){
    data.forEach(function(system){
        var factionstates = system.factions.filter(function(state){
            return state.state !== "None";
        });
        
        var paintfactionstates = factionstates.filter(function(d){
            return d.faction !== faction;
        });
 
        // sort in the right order
        
        var sortedStates = paintfactionstates.sort(function(s1, s2){
            return stateorder.indexOf(s1.state) - stateorder.indexOf(s2.state);
        });
        //console.log(sortedStates);
        
        // select existing ring and update color and opacity
        for(i=0;i<sortedStates.length;i++){
            svg.select("#_" + system.name.replace(/ /g, "_") + "_statering_" + (+i+1))
                .style("fill", statecolors[sortedStates[i].state])
                .style("opacity", 1.0);
        }
        
    });
}

function calculateMargin(data, faction){
    var factioninf = factionInfluence(data, faction);
    var closestmargin = 100;
    var otherfactions = data.filter(function(d){
        return d.faction !== faction;
    });
    otherfactions.forEach(function (d){
        var margin = Math.abs(factioninf - d.inf);
        if(margin < closestmargin){
            closestmargin = margin
        }
    });
    return closestmargin;
    
}

function setFaction(elem){
    selectedFaction = elem;
    createMap(selectedFaction);
}

function setDescription(svg, dataobj, elempercol, xoffset, xcol2offset, anchor){
    var item_counter = 0;
    var x = 0;
    var y = 20;
    dataobj.forEach(function(elem){
        svg.append("text")
            .attr("x", x)
            .attr("y", y)
            .text(elem.name)
            .style("font-weight", function(f){
                return (elem.value < 5) ? "bold" : "normal";
            })
            .style("fill", function(f){
                return (elem.value < 2.5) ? "red" : "";
            });
        svg.append("text")
            .attr("x", x + xcol2offset)
            .attr("y", y)
            .attr("text-anchor", anchor)
            .text(elem.value)
            .style("font-weight", function(f){
                return (elem.value < 5) ? "bold" : "normal";
            })
            .style("fill", function(f){
                return (elem.value < 2.5) ? "red" : "";
            });
        item_counter++;
        y = y + 20;
        if(item_counter%elempercol === 0){
            x = x + xoffset;
            y=20;
        }
    });
    
}

function getFactionState(data, faction){
    var state = "None";
    try{
        data.some(function (d){ 
            if(d.faction === faction){ 
                state = d.state}});
    }catch(e){
        if(e.name !== "TypeError"){
            throw e;
        }
    }
    return state;
    
}


 
