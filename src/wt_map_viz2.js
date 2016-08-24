

//Set our margins
var margin = {
    top: 40,
    right: 60,
    bottom: 40,
    left: 60
}, width = 600 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

var MAP_DEFAULT = "control";
var MAP_POPULATION = "population";
var MAP_INFLUENCE = "inf";
var MAP_STATES = "states";
var MAP_DANGERSPOT = "danger";
var mapview = MAP_DEFAULT;
var selectedFaction = "Wolf 406 Transport & Co";

// Add our chart to the document body
var svg = d3.select("body").append("svg")
    .attr("id", "wt_map")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
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
    "Elections": "lightcoral",
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

var dangerscale = d3.scale.linear()
    .domain([0,1,5,10,70])
    .range(["darkred", "red", "orange", "gold", "green"]);

d3.csv("wt_map.csv", function(error, mapdata) {
    
    console.log(mapdata);
    
    x_scale.domain([d3.min(mapdata, function(d){  return +d.x; }), d3.max(mapdata, function(d){  return +d.x; })]);
                    
    y_scale.domain([d3.min(mapdata, function(d){  return +d.z; }), d3.max(mapdata, function(d){  return +d.z; })]);
    
    var systems = svg.selectAll("system")
  	 .data(mapdata);
    
    // main system group
    var systemsEnter = systems.enter()
        .append("g")
        .attr("class", "system")
        .attr("id", function(d){ return "_" + d.system.replace(/ /g, "_"); })
        .attr("transform", function(d){ return "translate(" + x_scale(+d.x) + "," + y_scale(+d.z) +  ")"} );
    
    // create the state rings: should be drawn first to be below the main star circle
    // opacity = 0, initially
    for(var i=8; i > 0; i--){
        systemsEnter.append("circle")
            .attr("class", "staterings")
            .attr("id", function(d) { return "_" + d.system.replace(/ /g, "_") + "_statering_" + i;})
            .attr("r", 12+ (i*4))
            .style("opacity", .0);
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
        .text(function(d) { return d.system; })
        .style("stroke", "white")
        .style("stroke-width", "1.1px")
        .style("font-weight", "bold")
        .style("opacity", 0.8);
    
    //then the main label
    systemsEnter.append("text")
        .attr("class", "starlabel")
        .attr("dy", "2.1em")
        .attr("text-anchor", "middle")
        .text(function(d) { return d.system; })
        .style("font-weight", "bold")
        .style("opacity", 1);
    
    updateMap(mapview);
    
} ); 

function updateMap(view){
    
    var stateringIndex = 1;
    
    var svg = d3.select("svg#wt_map");
    svg.selectAll(".staterings")
        .style("opacity", 0.0);
    
    svg.selectAll(".population")
        .style("opacity", 0.0);
    
    
    
    svg = svg.selectAll(".system")
    d3.json("tracker_data.json", function(error, mapdata) {
   
        console.log(mapdata.systems);
        svg.data(mapdata.systems).enter();
            switch(view){
                // control
                case MAP_DEFAULT:
                    //show control: Y = fill with color, N means don't
                    svg.select(".star")
                        .style("stroke", "#0E6D74")
                        .style("fill", function(d){ 
                            return (selectedFactionIsRuler(d.factions, selectedFaction) === "Y" ? "#0E6D74" :         "white"); });
                    break;
                // influence
                case MAP_INFLUENCE:
                    //show influence as a gradient in the fill; control in the stroke
                    svg.select(".star")
                        .style("stroke", function(d){ 
                            return (selectedFactionIsRuler(d.factions, selectedFaction) === "Y" ? "green" : "maroon"); })
                        .style("fill", function(d){ return inf_scale(factionInfluence(d.factions, selectedFaction)); });
                    break;
                // states
                case MAP_STATES:
                    // fill increasing outer rings with states info
                    fillStateRings(svg, mapdata.systems);
                    // fill main star systems
                    svg.select(".star")
                        .style("stroke", "#E0E0E0")
                        .style("fill", function(d){ return selectedFactionStateColor(d.factions, selectedFaction); });
                    break;
                    
                case MAP_DANGERSPOT:
                    svg.select(".star")
                        .style("stroke", function(d){ 
                            return (selectedFactionIsRuler(d.factions, selectedFaction) === "Y" ? "green" : "maroon"); })
                        .style("fill", function(d){ return dangerscale(calculateMargin(d.factions, selectedFaction)); });
                    break;
                    
                case MAP_POPULATION:
                    svg.select(".population")
                    .style("opacity", 0.4);
                    //and ensure the base map is set right
                    //show control: Y = fill with color, N means don't
                    svg.select(".star")
                        .style("stroke", "#0E6D74")
                        .style("fill", function(d){ 
                            return (selectedFactionIsRuler(d.factions, selectedFaction) === "Y" ? "#0E6D74" :         "white"); });
                    break;
                    
            }
    });
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
    var state = "None";
    try{
        data.some(function (d){ 
            if(d.faction === faction){ 
                console.log(d.state);
                state = d.state}});
    }catch(e){
        if(e.name !== "TypeError"){
            throw e;
        }
    }
    return statecolors[state];
}

function fillStateRings(svg, data){
    data.forEach(function(system){
        var paintfactionstates = system.factions.filter(function(state){
            return state.state !== "None"
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
    //console.log(data);
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
    
