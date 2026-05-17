package service

import (
	"errors"
	"time"

	"github.com/aniqaqill/runners-list/internal/core/domain"
	"github.com/aniqaqill/runners-list/internal/port"
	"github.com/aniqaqill/runners-list/internal/port/mocks"
	"github.com/golang/mock/gomock"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

var _ = Describe("RaceService", func() {
	var (
		ctrl        *gomock.Controller
		mockRepo    *mocks.MockRaceRepository
		raceService *RaceService
	)

	BeforeEach(func() {
		ctrl = gomock.NewController(GinkgoT())
		mockRepo = mocks.NewMockRaceRepository(ctrl)
		raceService = NewRaceService(mockRepo)
	})

	AfterEach(func() {
		ctrl.Finish()
	})

	Describe("CreateRace", func() {
		It("should return an error if the race date is in the past", func() {
			pastRace := &domain.Race{
				Name: "Past Race",
				Date: time.Now().AddDate(-1, 0, 0),
			}

			err := raceService.CreateRace(pastRace)
			Expect(err).To(MatchError(ErrRaceDateInPast))
		})

		It("should return an error if the race name is not unique", func() {
			futureRace := &domain.Race{
				Name: "Future Race",
				Date: time.Now().AddDate(1, 0, 0),
			}

			mockRepo.EXPECT().
				RaceNameExists(futureRace.Name).
				Return(true)

			err := raceService.CreateRace(futureRace)
			Expect(err).To(MatchError(ErrRaceNameNotUnique))
		})

		It("should create the race if the date is in the future and the name is unique", func() {
			futureRace := &domain.Race{
				Name: "Future Race",
				Date: time.Now().AddDate(1, 0, 0),
			}

			mockRepo.EXPECT().
				RaceNameExists(futureRace.Name).
				Return(false)

			mockRepo.EXPECT().
				Create(futureRace).
				Return(nil)

			err := raceService.CreateRace(futureRace)
			Expect(err).NotTo(HaveOccurred())
		})
	})

	Describe("ListRaces", func() {
		It("should return a list of races", func() {
			races := []domain.Race{
				{Name: "Race 1", Date: time.Now().AddDate(1, 0, 0)},
				{Name: "Race 2", Date: time.Now().AddDate(1, 1, 0)},
			}
			filter := port.RaceFilter{}

			mockRepo.EXPECT().
				FindAll(filter).
				Return(races, nil)

			result, err := raceService.ListRaces(filter)
			Expect(err).NotTo(HaveOccurred())
			Expect(result).To(Equal(races))
		})

		It("should return an error if the repository fails", func() {
			filter := port.RaceFilter{}

			mockRepo.EXPECT().
				FindAll(filter).
				Return(nil, errors.New("repository error"))

			_, err := raceService.ListRaces(filter)
			Expect(err).To(HaveOccurred())
		})
	})

	Describe("DeleteRace", func() {
		It("should delete the race if it exists", func() {
			eventID := uint(1)
			r := &domain.Race{Name: "Race 1", Date: time.Now().AddDate(1, 0, 0)}

			mockRepo.EXPECT().
				FindByID(eventID).
				Return(r, nil)

			mockRepo.EXPECT().
				Delete(r).
				Return(nil)

			err := raceService.DeleteRace(eventID)
			Expect(err).NotTo(HaveOccurred())
		})

		It("should return an error if the race does not exist", func() {
			eventID := uint(1)

			mockRepo.EXPECT().
				FindByID(eventID).
				Return(nil, errors.New("race not found"))

			err := raceService.DeleteRace(eventID)
			Expect(err).To(HaveOccurred())
		})
	})

	Describe("isRaceDateInFuture", func() {
		It("should return true if the race date is in the future", func() {
			futureDate := time.Now().AddDate(1, 0, 0)
			Expect(isRaceDateInFuture(futureDate)).To(BeTrue())
		})

		It("should return false if the race date is in the past", func() {
			pastDate := time.Now().AddDate(-1, 0, 0)
			Expect(isRaceDateInFuture(pastDate)).To(BeFalse())
		})
	})
})
