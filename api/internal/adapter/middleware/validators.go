package middleware

import (
	"github.com/go-playground/validator/v10"
)

// Shared validator instance for middleware that parses and validates structs.
var validate = validator.New()
