function DistationCalculator(map, origin, zones, inputId, callback) {
    this._map = map;
	
	this._inputId = inputId;
	
	
    this._routeService = new DirectionsService({ avoidTrafficJams: true });
    this._routeRenderer = new DirectionsRenderer({ suppressPolylines: true, draggable: true, map: map });
    this._origin = origin;
    this._destination = null;
    this._wayPoints = new ymaps.GeoObjectCollection();
    map.geoObjects.add(this._wayPoints);
    this._zones = [];
    
    this.callback = callback;

    this._initZones(zones);
    this._routeRenderer.events.add('waypointschange', this._onWayPointsChange, this);
	
	
	
}

DistationCalculator.prototype = {



    constructor: DistationCalculator,
    
    
    
    _onDestinationChange: function (e) {
        this.setDestination(e.get('coordPosition'));
    },
    
    
    
    _initZones: function (zones) {
        zones.forEach(function (zone, i) {
            (this._zones[i] = new DeliveryZone(zone))
                .getCoordinates()
                .events.add('ready', this._onZoneReady, this);
        }, this);
    },
    
    
    
    _onZoneReady: function (e) {
        e.get('target').setMap(this._map);
    },
    
    
    
    _onWayPointsChange: function (e) {
        this.getDirections(
            this._origin = e.get('origin'),
            this._destination = e.get('destination')
        );
    },
    
    
    
    getDirections: function (origin, destination) {
        let handler = this._onRouteSuccess.bind(this);
        
        if(origin && destination) {
			
			//alert('DeliveryCalculator.getDirections');
			
            this._routeService.route({
                origin: origin,
                destination: destination
            }, handler);
        }
    },
    
    
    
    _onRouteSuccess: function (result) {
        this._zones.forEach(function (zone) {
            zone.clear();
        });
        this._wayPoints.options.set('visible', false);
        this._routeRenderer.setDirections(result);
        this.calculate(result.routes[0]);
    },
    
    
    
    setDestination: function (position) {
        this._wayPoints.options.set('visible', true);
        this._wayPoints.add(new ymaps.Placemark(position, {iconContent: 'B'}), 1);
        this.getDirections(this._origin, this._destination = position);
    },
    
    
    
    getDestination: function () {
        return this._destination;
    },
    
    
    
    setOrigin: function (position) {
        this._wayPoints.options.set('visible', true);
        this._wayPoints.add(new ymaps.Placemark(position, {iconContent: 'A'}), 0);
        this.getDirections(this._origin = position, this._destination);
    },
    
    
    
    getOrigin: function () {
        return this._origin;
    },
    
    
    
    getWaypoints: function () {
        return this._wayPoints;
    },
    
    
    
    clear: function () {
        this._zones.forEach(function (zone) {
            zone.clear();
        });
        this._wayPoints.removeAll();
        this._routeRenderer.clear();
        this._origin = this._destination = null;
    },
    
    
    
    calculate: function (route) {
        var results = {zones:[], total:{}},
            total = {
                name: 'Итого',
                duration: 0,
                distance: 0,
                value: 0
            };

        this._zones.forEach(function (zone) {
            var result = zone.calculate(route);

            total.duration += result.duration;
            total.distance += result.distance;
			
            total.value += result.value;
            results.zones.push(result);

            zone.render();
        });

        results.total = total;
        
        const debugInfo = document.getElementById('debug-info');
        debugInfo.value = JSON.stringify(results, null, 4);
		
		this.callback(results);
    }

};