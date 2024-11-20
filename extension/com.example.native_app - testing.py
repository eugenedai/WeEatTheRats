#!/usr/bin/env python3
import sys
import json
import struct
import logging

# Set up logging
logging.basicConfig(
    filename='/tmp/native_app.log',
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def send_message(message):
    try:
        logging.debug(f"Sending message: {message}")
        encoded = json.dumps(message).encode('utf-8')
        sys.stdout.buffer.write(struct.pack('I', len(encoded)))
        sys.stdout.buffer.write(encoded)
        sys.stdout.buffer.flush()
    except Exception as e:
        logging.error(f"Error sending message: {e}")

def read_message():
    try:
        raw_length = sys.stdin.buffer.read(4)
        if not raw_length:
            logging.warning("No data received")
            return None
        message_length = struct.unpack('I', raw_length)[0]
        message = sys.stdin.buffer.read(message_length).decode('utf-8')
        logging.debug(f"Received message: {message}")
        return json.loads(message)
    except Exception as e:
        logging.error(f"Error reading message: {e}")
        return None

def main():
    logging.info("Native app started")
    while True:
        message = read_message()
        if message is None:
            break
        
        send_message({
            "response": f"Received: {message}",
            "status": "success"
        })

if __name__ == '__main__':
    main()