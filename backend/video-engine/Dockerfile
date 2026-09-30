# syntax=docker/dockerfile:1

FROM golang:1.24-alpine AS builder
WORKDIR /src

COPY go.mod ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -trimpath -ldflags "-s -w" -o /out/video-engine .

FROM alpine:3.20
RUN apk add --no-cache ffmpeg ca-certificates
WORKDIR /app

COPY --from=builder /out/video-engine /app/video-engine
RUN mkdir -p /app/uploads

ENV PORT=8080
EXPOSE 8080

CMD ["/app/video-engine"]
