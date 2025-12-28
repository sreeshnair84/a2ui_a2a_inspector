import requests
import json
import sys

def debug_stream():
    url = "http://localhost:8000/api/chat/stream"
    payload = {
        "message": "Hello",
        "agent_url": "http://localhost:8001",
        "session_id": "debug_session",
        "use_push": False
    }
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer fake-token-if-needed" # The backend might not enforce auth on localhost dev or I need to login
    }
    
    # Try to login first if needed? The user is authenticated in UI.
    # Let's assume dev auth or try to fetch a token if possible?
    # Or just hit the endpoint and see if 401.
    
    print(f"Connecting to {url}...")
    try:
        with requests.post(url, json=payload, headers=headers, stream=True) as r:
            if r.status_code == 401:
                print("Auth required. Skipping auth for now (complex to automate login).")
                return

            print(f"Status: {r.status_code}")
            for line in r.iter_lines():
                if line:
                    decoded_line = line.decode('utf-8')
                    print(f"RECEIVED: {decoded_line}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug_stream()
