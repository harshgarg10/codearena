FROM gcc:12
RUN apt-get update && apt-get install -y time && rm -rf /var/lib/apt/lists/*
COPY runner.sh /runner.sh
RUN chmod +x /runner.sh
WORKDIR /code
COPY . /code/
CMD ["/runner.sh"]