// The constructor function for Church objects
var Church = function(data) {
  this.name = ko.observable(data.name);
  this.location = ko.observable(data.location);
  this.centuryBuilt = ko.observable(data.centuryBuilt);
  this.architecture = ko.observable(data.architecture);
};

// The Knockout viewmodel
var ViewModel = function() {
  // Storing a pointer to the ViewModel
  var self = this;

  // Menu and Close (Menu) button implementation
  this.menuIsVisible = ko.observable(false);
  this.menuBtnIsVisible = ko.observable(true);

  this.toggleSidenav = function() {
    self.menuIsVisible(!self.menuIsVisible());
    self.menuBtnIsVisible(!self.menuBtnIsVisible());
  };

  // Enabling the centuryBuilt drop-down menu
  this.enableCentury = ko.observable(true);

  // Enabling the architecture drop-down menu
  this.enableArchitecture = ko.observable(true);

  // Hiding the Reset Button by default
  this.showResetButton = ko.observable(false);

  // Creating an array of century options
  this.availableCenturies = [];
  for (var k = 0; k < churches.length; k++) {
    var century = churches[k].centuryBuilt;
    if (this.availableCenturies.indexOf(century) === - 1) {
      this.availableCenturies.push(century);
    }
  }
  this.availableCenturies.sort(function(a, b) {
    return a - b;
  });

  // Creating an array of architecture options
  this.availableArchitectures = [];
  for (var l = 0; l < churches.length; l++) {
    var architecture = churches[l].architecture;
    if (this.availableArchitectures.indexOf(architecture) === -1) {
      this.availableArchitectures.push(architecture);
    }
  }
  this.availableArchitectures.sort();

  // Creating an observable array
  this.churchList = ko.observableArray([]);

  // Creating instances of Church objects and storing them in the observable array
  for (var i = 0; i < churches.length; i++) {
    this.churchList.push(new Church(churches[i]));
  }

  // Filter for churchList (centuryBuilt)
  this.selectedCentury = ko.observable();
  this.filterCenturyBuilt = function(viewModel) {
    for (var i = self.churchList().length - 1; i >= 0; i--) {
      if (self.churchList()[i].centuryBuilt() != self.selectedCentury()) {
        self.churchList.splice([i], 1);
        // disabling the centuryBuilt drop-down menu
        self.enableCentury(false);
        // showing the Reset button
        self.showResetButton(true);
      }
    }
    // Shows the markers that are currently in the churchList
    self.showMarkers();
  };

  // Filter for churchList (architecture)
  this.selectedArchitecture = ko.observable();
  this.filterArchitecture = function(viewModel) {
    for (var i = self.churchList().length - 1; i >= 0; i--) {
      if (self.churchList()[i].architecture() != self.selectedArchitecture()) {
        self.churchList.splice([i], 1);
        // disabling the architecture drop-down menu
        self.enableArchitecture(false);
        // showing the Reset button
        self.showResetButton(true);
      }
    }
    // Shows the markers that are currently in the churchList
    self.showMarkers();
  };

  // EventListener for the Reset List button
  this.resetList = function() {
    self.churchList([]);
    // Filling the churchList with objects again
    for (var i = 0; i < churches.length; i++) {
      self.churchList.push(new Church(churches[i]));
    }
    // enabling the drop-down menus
    self.enableCentury(true);
    self.enableArchitecture(true);
    // Hiding the reset button
    self.showResetButton(false);
    // Selecting the default option of the drop-down menus again
    self.selectedCentury(undefined);
    self.selectedArchitecture(undefined);
    // Shows the markers that are currently in the churchList
    self.showMarkers();
  };

  // Putting a marker on each location
  // Parts of this function is similar to the code examples shown in Lesson 17
  this.showMarkers = function() {
    // Checks if churchList is empty to avoid odd map behaviour
    if (self.churchList().length === 0) {
      map.setCenter({ lat: 50.9357141, lng: 6.9600099 });
      map.setZoom(14);
      window.alert('There are no churches with these criteria. Please reset list and filter again!');
    }
    else {
      // Deletes all markers if markers are present
      if (markers.length > 0) {
        for (var i = 0; i < markers.length; i++) {
          markers[i].setMap(null);
        }
        markers = [];
        console.log('The markers were deleted');
        self.showMarkers();
      }
      else {
        // Keeping track of the LatLngBounds
        var bounds = new google.maps.LatLngBounds();

        // Creating an infoWindow
        var infoWindow = new google.maps.InfoWindow();

        self.churchList().forEach(function(church) {
          var marker = new google.maps.Marker({
            position: church.location(),
            title: church.name(),
            animation: google.maps.Animation.DROP,
            opacity: 0.5
          });
          // Puts one marker on the map
          marker.setMap(map);
          // Extends the LatLngBounds of the map so that it contains the location
          bounds.extend(marker.position);
          // Adding an eventListener to the marker
          marker.addListener('click', function() {
            self.showInfoWindow(this, infoWindow);
            this.setOpacity(1.0);
          });
          // Storing the markers in an array
          markers.push(marker);
        });
        // Sets the viewport to contain the bounds
        map.fitBounds(bounds);
      }
    }
  };

  // Shows one infoWindow for the church that was clicked on in the list
  this.showOneInfoWindow = function(church) {
    // Checks if an infoWindow is still open and closes it
    if (oldInfoWindow) {
      oldInfoWindow.marker.setOpacity(0.5);
      oldInfoWindow.close();
    }
    // Creating an infoWindow
    var infoWindow = new google.maps.InfoWindow();

    // Searches for the right marker to put the infoWindow on
    for (var i = 0; i < markers.length; i++) {
        if (markers[i].title === church.name()) {
        self.showInfoWindow(markers[i], infoWindow);
        markers[i].setOpacity(1.0);
      }
    }
  };

  // Creating an infoWindow for a marker
  // Parts of this function are similar to the code examples shown in Lesson 17
  this.showInfoWindow = function(marker, infoWindow) {
    // Checks if an infoWindow is still open and closes it
    if (oldInfoWindow) {
      oldInfoWindow.marker.setOpacity(0.5);
      oldInfoWindow.close();
    }
    // Checks if the infoWindow on this marker is already open
    if (infoWindow.marker != marker) {
      infoWindow.marker = marker;
      // Storing htmlString
      var htmlString = '';

      // Wikipedia Ajax request
      var url = 'https://en.wikipedia.org/w/api.php?action=opensearch&search=' + marker.title + '&format=json&limit=1';

      // Requesting data from wikipedia
      $.ajax(url, {
        dataType: 'jsonp',
        timeout: 7000,
        success: function(data) {
          var title = data[1];
          var shortText = data[2];
          var link = data[3];
          htmlString += '<div id="wikiContainer">' +
          '<h4>' + title + '</h4>' +
          '<p class="infoText">Description from Wikipedia:</p>' +
          '<p class="infoText">' + shortText + '</p>' +
          '<p class="infoText">This is a link to the Wikipedia article:</p>' +
          '<a href="' + link + '" target="_blank">' + title + '</a>' +
          '<p class="attribution">The above information uses material from the Wikipedia article ' +
          '<a href="' + link + '" target=_blank">"' + title + '"</a>, which is released under the ' +
          '<a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank">Creative Commons' +
          'Attribution-Share-Alike License 3.0</a>.</p>' +
          '</div>';
          // Starting the next ajax request (this way ensures the right order of content)
          anotherRequest();
        }
      }).fail(function() {
        htmlString += '<p>Unable to load Wikipedia resources!</p>';
        anotherRequest();
      });

      // openweathermap ajax request
      var urlWeather = 'https://api.openweathermap.org/data/2.5/weather?id=6691073' +
      '&APPID=YOUR-KEY-HERE&units=metric&lang=en';

      // Requesting data from openweathermap.org
      var anotherRequest = function() {
        $.ajax(urlWeather, {
          dataType: 'json',
          timeout: 7000,
          success: function(data) {
            htmlString += '<div id="weatherContainer">' +
            '<h5>Current Weather:</h5>' +
            '<img id="icon" src="https://openweathermap.org/img/w/' + data.weather[0].icon + '.png">' +
            '<div id="weatherData"' +
            '<p class="infoText">' + data.weather[0].description + '</p>' +
            '<p class="infoText">Temperature: <span>' + data.main.temp + ' °C</span></p>' +
            '<p class="infoText">Windspeed: <span>' + data.wind.speed + ' m/sec</span></p>' +
            '<p class="infoText">Humidity: <span>' + data.main.humidity + ' %  </span><span>' +
            data.main.pressure + ' hPa</span></p></div>' +
            '<p class="attribution">This weather report is delivered by ' +
            '<a href="https://openweathermap.org/" target="_blank">OpenWeatherMap</a></p>' +
            '<p class="attribution">This weather data is made available under the Open Database ' +
            'License: <a href="http://opendatacommons.org/licenses/odbl/1.0/" ' +
            'target="_blank">http://opendatacommons.org/licenses/odbl/1.0/</a>.' +
            ' Any rights in individual contents ' +
            'of the database are licensed under the Database Contents License: ' +
            '<a href="http://opendatacommons.org/licenses/dbcl/1.0/"' +
            ' target="_blank">http://opendatacommons.org/licenses/dbcl/1.0/</a>' +
            '</div>';
            // Setting options of infoWindow
            infoWindow.setOptions({
              content: htmlString
            });
            oldInfoWindow = infoWindow;
            infoWindow.open(map, marker);
          }
        }).fail(function() {
          htmlString += '<p>Unable to load data from OpenWeatherMap!</p>';
          // Setting options of infoWindow
          infoWindow.setOptions({
            content: htmlString
          });
          infoWindow.open(map, marker);
        });
      };

      // This clears the marker property and sets oldInfoWindow to null when closing the infoWindow
      infoWindow.addListener('closeclick', function() {
        infoWindow.setMarker = null;
        marker.setOpacity(0.5);
        oldInfoWindow = null;
      });
    }
  };
};
// Starting knockout.js
var vm = new ViewModel();
ko.applyBindings(vm);

// Code for google maps
var map;

var oldInfoWindow = null;

var markers = [];

function initMap() {
  // Creating the map
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 50.9357141, lng: 6.9600099 },
    zoom: 14,
    mapTypeControl: false
  });
  // Show the initial markers on map
  vm.showMarkers();

  // Center the map when the map is resized
  // The idea and parts of the code were taken from this discussion:
  // https://stackoverflow.com/questions/8792676/center-google-maps-v3-on-browser-resize-responsive
  var center;
  google.maps.event.addDomListener(map, 'idle', function() {
    center = map.getCenter();
  });
  google.maps.event.addDomListener(window, 'resize', function() {
    map.setCenter(center);
  });
}

// Error handling for google maps api
function mapsError(msg, source, lineNo, columnNo, error) {
  window.alert('The google maps map could not be loaded. Please try again.');
  console.log('Message: ' + msg + '\n' + 'Source: ' + source + '\n' + 'Line: ' + lineNo + '\n' + 'Column: ' + columnNo +
  '\n' + 'Error Object: ' + error);
}
