"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeolocationService = void 0;
const common_1 = require("@nestjs/common");
const EARTH_RADIUS_M = 6371000;
let GeolocationService = class GeolocationService {
    computeDetectionLocation(nav, bbox, imageWidth, imageHeight) {
        if (nav.navigationSource === 'UNAVAILABLE' ||
            nav.latitude === null ||
            nav.longitude === null ||
            nav.heading === null ||
            nav.range === null ||
            !imageWidth) {
            return {
                latitude: null,
                longitude: null,
                depth: nav.depth,
                locationStatus: 'UNAVAILABLE',
                lengthMetres: null,
                widthMetres: null,
            };
        }
        const centerX = (bbox.x1 + bbox.x2) / 2;
        const centerY = (bbox.y1 + bbox.y2) / 2;
        const halfWidth = imageWidth / 2;
        const isPortHalf = centerX < halfWidth;
        const side = nav.side === 'BOTH' || nav.side === 'UNKNOWN' ? (isPortHalf ? 'PORT' : 'STARBOARD') : nav.side;
        const pixelFromNadir = isPortHalf ? halfWidth - centerX : centerX - halfWidth;
        const fractionOfRange = Math.min(1, Math.max(0, pixelFromNadir / halfWidth));
        const acrossTrackDistance = fractionOfRange * nav.range;
        const bearingDeg = side === 'PORT' ? nav.heading - 90 : nav.heading + 90;
        const bearingRad = (((bearingDeg % 360) + 360) % 360) * (Math.PI / 180);
        const destination = this.destinationPoint(nav.latitude, nav.longitude, acrossTrackDistance, bearingRad);
        const metresPerPixel = nav.range / halfWidth;
        const widthMetres = Math.abs(bbox.x2 - bbox.x1) * metresPerPixel;
        const lengthMetres = Math.abs(bbox.y2 - bbox.y1) * metresPerPixel;
        return {
            latitude: Number(destination.lat.toFixed(6)),
            longitude: Number(destination.lon.toFixed(6)),
            depth: nav.depth,
            locationStatus: nav.navigationSource === 'REAL' ? 'REAL' : 'ESTIMATED',
            lengthMetres: Number(lengthMetres.toFixed(2)),
            widthMetres: Number(widthMetres.toFixed(2)),
        };
    }
    destinationPoint(lat, lon, distanceMetres, bearingRad) {
        const latRad = (lat * Math.PI) / 180;
        const lonRad = (lon * Math.PI) / 180;
        const angularDistance = distanceMetres / EARTH_RADIUS_M;
        const destLatRad = Math.asin(Math.sin(latRad) * Math.cos(angularDistance) +
            Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(bearingRad));
        const destLonRad = lonRad +
            Math.atan2(Math.sin(bearingRad) * Math.sin(angularDistance) * Math.cos(latRad), Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(destLatRad));
        return {
            lat: (destLatRad * 180) / Math.PI,
            lon: (destLonRad * 180) / Math.PI,
        };
    }
};
exports.GeolocationService = GeolocationService;
exports.GeolocationService = GeolocationService = __decorate([
    (0, common_1.Injectable)()
], GeolocationService);
//# sourceMappingURL=geolocation.service.js.map