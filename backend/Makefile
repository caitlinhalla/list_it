.PHONY: deps setup server test migrate rollback format

deps:
	mix deps.get

setup: deps
	mix ecto.create
	mix ecto.migrate

server:
	mix phx.server

test:
	mix test

migrate:
	mix ecto.migrate

rollback:
	mix ecto.rollback

format:
	mix format
