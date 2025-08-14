FROM python:3.11-alpine
RUN apk add --no-cache bash time
COPY runner.sh /runner.sh
RUN chmod +x /runner.sh
WORKDIR /code
USER nobody
CMD ["/runner.sh"]