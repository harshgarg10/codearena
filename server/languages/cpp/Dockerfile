FROM ubuntu:22.04
RUN apt-get update && \
    apt-get install -y g++ time && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get clean
COPY runner.sh /runner.sh
RUN chmod +x /runner.sh
WORKDIR /code
USER nobody
CMD ["/runner.sh"]