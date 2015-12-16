'use strict';

var _ = require('lodash');
var request = require('request');

// parameters
var targetIbuRange = [75, 78];
var targetAbv = [6.5, 9.5];
var targetStyle = 'Belgian';

// globals
var selectedBeers = [];
var computedStyles = [];


// filters
var isStrongEnough = function(beer){
    return beer.abv > targetAbv[0] && beer.abv < targetAbv[1];
};

var isMyStyle = function(beer){
    return _.includes(computedStyles, beer.style.id);
};

// requests

var computeStyles = function(cb){
    var url = 'http://api.brewerydb.com/v2/styles?key=2d2c1f8d4c2e8a23b03b0f47247a2c45';
    var styleRegexp = new RegExp(targetStyle);    

    //TODO use fuzzy matching insteadof regexp

    request.get(url, function(err, res){
        
        if(!err){
            var styles = JSON.parse(res.body).data;

            computedStyles = _.chain(styles)
                           .filter(function(style){
                                return styleRegexp.test(style.name);
                            })
                            .map(function(style){
                              return style.id;
                            })
                           .value();
        }

        cb();
    }); 
}

var getBeers = function(ibu){
    var url = 'http://api.brewerydb.com/v2/beers?key=2d2c1f8d4c2e8a23b03b0f47247a2c45&ibu=' + ibu;

    request.get(url, function(err, res){
        
        if(!err){
            var beers = JSON.parse(res.body).data;

            var results = _.chain(beers)
                           .filter(isStrongEnough)
                           .filter(isMyStyle)
                           .map(function(beer){
                                return beer.name;
                           })
                           .value();

            selectedBeers = selectedBeers.concat(results);
        }

        //TODO make parallel requests

        if(ibu < targetIbuRange[1]){
            process.nextTick(getBeers, [++ibu]);
        }else{
            if(selectedBeers.length > 10){
                console.log(selectedBeers.length + ' beers found');
            }else if (selectedBeers.length > 0){
                console.log(results);
            }else{
                console.log('no beer found');
            }
        }
    });

};

console.log('Searching...');

computeStyles(function(){
    getBeers(targetIbuRange[0]);
});
