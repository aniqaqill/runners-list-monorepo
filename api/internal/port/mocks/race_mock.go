package mocks

import (
	"reflect"

	"github.com/aniqaqill/runners-list/internal/core/domain"
	"github.com/aniqaqill/runners-list/internal/port"
	"github.com/golang/mock/gomock"
)

// MockRaceRepository is a mock of RaceRepository interface.
type MockRaceRepository struct {
	ctrl     *gomock.Controller
	recorder *MockRaceRepositoryMockRecorder
}

// MockRaceRepositoryMockRecorder is the mock recorder for MockRaceRepository.
type MockRaceRepositoryMockRecorder struct {
	mock *MockRaceRepository
}

// NewMockRaceRepository creates a new mock instance.
func NewMockRaceRepository(ctrl *gomock.Controller) *MockRaceRepository {
	mock := &MockRaceRepository{ctrl: ctrl}
	mock.recorder = &MockRaceRepositoryMockRecorder{mock}
	return mock
}

// EXPECT returns an object that allows the caller to indicate expected use.
func (m *MockRaceRepository) EXPECT() *MockRaceRepositoryMockRecorder {
	return m.recorder
}

// Create mocks base method.
func (m *MockRaceRepository) Create(race *domain.Race) error {
	m.ctrl.T.Helper()
	ret := m.ctrl.Call(m, "Create", race)
	ret0, _ := ret[0].(error)
	return ret0
}

// Create indicates an expected call of Create.
func (mr *MockRaceRepositoryMockRecorder) Create(race interface{}) *gomock.Call {
	mr.mock.ctrl.T.Helper()
	return mr.mock.ctrl.RecordCallWithMethodType(mr.mock, "Create", reflect.TypeOf((*MockRaceRepository)(nil).Create), race)
}

// Delete mocks base method.
func (m *MockRaceRepository) Delete(race *domain.Race) error {
	m.ctrl.T.Helper()
	ret := m.ctrl.Call(m, "Delete", race)
	ret0, _ := ret[0].(error)
	return ret0
}

// Delete indicates an expected call of Delete.
func (mr *MockRaceRepositoryMockRecorder) Delete(race interface{}) *gomock.Call {
	mr.mock.ctrl.T.Helper()
	return mr.mock.ctrl.RecordCallWithMethodType(mr.mock, "Delete", reflect.TypeOf((*MockRaceRepository)(nil).Delete), race)
}

// RaceNameExists mocks base method.
func (m *MockRaceRepository) RaceNameExists(name string) bool {
	m.ctrl.T.Helper()
	ret := m.ctrl.Call(m, "RaceNameExists", name)
	ret0, _ := ret[0].(bool)
	return ret0
}

// RaceNameExists indicates an expected call of RaceNameExists.
func (mr *MockRaceRepositoryMockRecorder) RaceNameExists(name interface{}) *gomock.Call {
	mr.mock.ctrl.T.Helper()
	return mr.mock.ctrl.RecordCallWithMethodType(mr.mock, "RaceNameExists", reflect.TypeOf((*MockRaceRepository)(nil).RaceNameExists), name)
}

// FindAll mocks base method.
func (m *MockRaceRepository) FindAll(filter port.RaceFilter) ([]domain.Race, error) {
	m.ctrl.T.Helper()
	ret := m.ctrl.Call(m, "FindAll", filter)
	ret0, _ := ret[0].([]domain.Race)
	ret1, _ := ret[1].(error)
	return ret0, ret1
}

// FindAll indicates an expected call of FindAll.
func (mr *MockRaceRepositoryMockRecorder) FindAll(filter interface{}) *gomock.Call {
	mr.mock.ctrl.T.Helper()
	return mr.mock.ctrl.RecordCallWithMethodType(mr.mock, "FindAll", reflect.TypeOf((*MockRaceRepository)(nil).FindAll), filter)
}

// FindByID mocks base method.
func (m *MockRaceRepository) FindByID(id uint) (*domain.Race, error) {
	m.ctrl.T.Helper()
	ret := m.ctrl.Call(m, "FindByID", id)
	ret0, _ := ret[0].(*domain.Race)
	ret1, _ := ret[1].(error)
	return ret0, ret1
}

// FindByID indicates an expected call of FindByID.
func (mr *MockRaceRepositoryMockRecorder) FindByID(id interface{}) *gomock.Call {
	mr.mock.ctrl.T.Helper()
	return mr.mock.ctrl.RecordCallWithMethodType(mr.mock, "FindByID", reflect.TypeOf((*MockRaceRepository)(nil).FindByID), id)
}

// Upsert mocks base method.
func (m *MockRaceRepository) Upsert(race *domain.Race) error {
	m.ctrl.T.Helper()
	ret := m.ctrl.Call(m, "Upsert", race)
	ret0, _ := ret[0].(error)
	return ret0
}

// Upsert indicates an expected call of Upsert.
func (mr *MockRaceRepositoryMockRecorder) Upsert(race interface{}) *gomock.Call {
	mr.mock.ctrl.T.Helper()
	return mr.mock.ctrl.RecordCallWithMethodType(mr.mock, "Upsert", reflect.TypeOf((*MockRaceRepository)(nil).Upsert), race)
}

// BulkUpsert mocks base method.
func (m *MockRaceRepository) BulkUpsert(races []domain.Race) (int, int, error) {
	m.ctrl.T.Helper()
	ret := m.ctrl.Call(m, "BulkUpsert", races)
	ret0, _ := ret[0].(int)
	ret1, _ := ret[1].(int)
	ret2, _ := ret[2].(error)
	return ret0, ret1, ret2
}

// BulkUpsert indicates an expected call of BulkUpsert.
func (mr *MockRaceRepositoryMockRecorder) BulkUpsert(races interface{}) *gomock.Call {
	mr.mock.ctrl.T.Helper()
	return mr.mock.ctrl.RecordCallWithMethodType(mr.mock, "BulkUpsert", reflect.TypeOf((*MockRaceRepository)(nil).BulkUpsert), races)
}
