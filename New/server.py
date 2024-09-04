from flask import Flask, request, jsonify
from pymongo import MongoClient
from geopy.distance import geodesic
from datetime import datetime

app = Flask(__name__)

# MongoDB setup
client = MongoClient('mongodb://localhost:27017/')
db = client.locationDB
locations = db.locations

# Static locationpyth
static_location = (12.9715987, 77.594566)  # Example latitude and longitude

# API endpoint to receive location data from the mobile app
@app.route('/location', methods=['POST'])
def location():
    data = request.json
    latitude = data.get('latitude')
    longitude = data.get('longitude')

    if latitude is None or longitude is None:
        return jsonify({"error": "Invalid location data"}), 400

    mobile_location = (latitude, longitude)
    distance = geodesic(static_location, mobile_location).meters

    location_entry = locations.find_one(sort=[("inTime", -1)])

    if distance <= 200:
        if not location_entry or 'outTime' in location_entry:
            locations.insert_one({
                'inTime': datetime.utcnow(),
                'coordinates': {'latitude': latitude, 'longitude': longitude}
            })
            return jsonify({"message": "In-time recorded"}), 200
    else:
        if location_entry and 'outTime' not in location_entry:
            locations.update_one(
                {'_id': location_entry['_id']},
                {'$set': {'outTime': datetime.utcnow()}}
            )
            return jsonify({"message": "Out-time recorded"}), 200

    return jsonify({"message": "Location processed"}), 200

# Start the server
if __name__ == '__main__':
    app.run(port=5000, debug=True)
