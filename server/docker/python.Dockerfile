FROM python:3.10-slim
RUN apt-get update && apt-get install -y time && rm -rf /var/lib/apt/lists/*
WORKDIR /code
CMD bash -c "timeout 2s /usr/bin/time -f 'TIME:%e' python3 -u main.py < input.txt > output.txt 2>&1; echo 'EXIT_CODE:'$? >> output.txt"