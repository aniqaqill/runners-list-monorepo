package main

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gofiber/fiber/v2"
)

func TestFiberSmoke_GETRoot(t *testing.T) {
	t.Parallel()

	app := fiber.New()
	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("hello")
	})

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	resp, err := app.Test(req, 2000)
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status=%d", resp.StatusCode)
	}
	body, _ := io.ReadAll(resp.Body)
	_ = resp.Body.Close()
	if string(body) != "hello" {
		t.Fatalf("body=%q", body)
	}
}

func TestBodyParser_truncatedJSONFailsCleanly(t *testing.T) {
	t.Parallel()

	app := fiber.New()
	app.Post("/x", func(c *fiber.Ctx) error {
		var v fiber.Map
		if err := c.BodyParser(&v); err != nil {
			return err
		}
		return nil
	})

	req := httptest.NewRequest(http.MethodPost, "/x", strings.NewReader(`{"a":`))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req, 2000)
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode == http.StatusOK {
		t.Fatal("expected error response for malformed JSON")
	}
}
