from flask import Flask
import os
import psycopg2

app = Flask(__name__)

@app.route("/")
def hello():
    db_user = os.getenv("POSTGRES_USER")
    db_name = os.getenv("POSTGRES_DB")
    return f"Hello Docker! Connected to DB {db_name} as {db_user}"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
