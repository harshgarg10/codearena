FROM openjdk:17-alpine
RUN apk add --no-cache bash coreutils
COPY runner.sh /runner.sh
RUN chmod +x /runner.sh
WORKDIR /code
# Set JVM options for low memory usage and smaller code cache
ENV JAVA_OPTS="-Xms32m -Xmx128m -XX:ReservedCodeCacheSize=64m -XX:CompressedClassSpaceSize=32m -XX:MaxMetaspaceSize=128m"
USER nobody
CMD ["/runner.sh"]