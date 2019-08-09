function DeliveryZone(options) {
    this._options = options;
    this.events = new ymaps.event.Manager();
	this.myGeoObjects = [];
}

DeliveryZone.prototype = {



    constructor: DeliveryZone,
    
    
    
    getCoordinates: function () {
        $.ajax({
            url: this._options.url,
            dataType: 'json',
            success: $.proxy(this._onCoordinatesReceived, this)
        });

        return this;
    },
    
    
    
    _onCoordinatesReceived: function (json) {
        let myGeoObject = new ymaps.GeoObject({ 
			geometry: json, 
			// Описываем данные геообъекта.
			properties: {
				hintContent: this._options.id
			}
		}, {
			// Включаем отображение в форме геодезических кривых.
			geodesic: true,
			// Задаем ширину в 5 пикселей.
			strokeWidth: 5,
			// Задаем цвет линии.
			strokeColor: "#000",
			// Цвет заливки.
			fillColor: '#00FF0088'
		});
		
		this.myGeoObjects.push(myGeoObject);
		
        this.geometry = myGeoObject.geometry;
        this.events.fire('ready', {
            target: this
        });
    },
    
    
    
    _createPolyline: function (path, distance) {
        this._polyline = new ymaps.Polyline(path, {
            hintContent: this._options.label,
            balloonContentBody: 'Расстояние: <b>' + distance + '</b>'
        }, {
            strokeColor: this._options.color,
            strokeWidth: 6
        });
        
       
    },
    
    
    
    _contains: function (leg_or_step) {
        return this.geometry.contains(leg_or_step.start_location) ||
            this.geometry.contains(leg_or_step.end_location);
    },
    
    
    
    _getPath: function (route) {
        var flatten = function (a, b) { return a.concat(b); },
            steps = route.legs
                .filter(this._contains, this)
                .map(function (leg) {
                    return leg.steps;
                }),
            path = steps.length? steps
                .reduce(flatten)
                .filter(this._contains, this)
                .map(function (step) {
                    return step.path;
                })
                .reduce(flatten)
                .filter(function (point, i, points) {
                    return this.geometry.contains(point) ||
                        (points[i - 1] && this.geometry.contains(points[i - 1]));
                }, this) : [];

        return path;
    },
    
    
    
    _getDistance: function (path) {
        var coordSystem = this._map.options.get('projection').getCoordSystem();

        return path.reduce(function (distance, point, index, points) {
            return distance + coordSystem.getDistance(points[index - 1] || point, point);
        }, 0);
    },
    
    
    
    setMap: function (map) {
        this._map = map;
		
		switch(this._options.id){
			case 'mo':
			/*
				// Если нужно отобразить на карте границы МО
				this.myGeoObjects.forEach(function(item, i, arr) {
					map.geoObjects.add(item);
				});
				*/
				break;
		}
		
		
		
        this.geometry.setMap(map);
        this.geometry.options.setParent(map.options);

        return this;
    },
    
    
    
    calculate: function (route) {
        var path = this._getPath(route),
            distance = this._getDistance(path);

        let renderedDistance = Math.round(distance);
        
        this._createPolyline(path, Math.round(renderedDistance / 1000));

        return ymaps.util.extend({
            distance: renderedDistance,
            value: Math.round(distance / 1000)
        }, this._options);
    },
    
    
    
    render: function (path) {
        if(this._map) {
            this._map.geoObjects.add(this._polyline);
            this._polyline.balloon.open();
        }
    },
    
    
    
    clear: function () {
        if(this._map && this._polyline) {
            this._map.geoObjects.remove(this._polyline);
        }
    }
}