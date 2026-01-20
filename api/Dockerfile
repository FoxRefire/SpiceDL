FROM python:3.13-slim

RUN apt-get update -qq && apt-get install ffmpeg -y

RUN groupadd -r appuser && useradd -r -m -g appuser appuser

WORKDIR /usr/src/app

ENV SPICEDL_HEADLESS=1

COPY requirements.txt ./
RUN pip install -r requirements.txt
RUN pip install spotdl

COPY . .
RUN chown -R appuser:appuser *

EXPOSE 5985

USER appuser

CMD [ "python", "app.py" ]
