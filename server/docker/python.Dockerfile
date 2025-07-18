FROM python:3.10-slim
WORKDIR /code
CMD timeout 5s python3 main.py < input.txt