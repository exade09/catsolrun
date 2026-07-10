export interface RewardService {
  readonly enabled: boolean
  claim: () => Promise<never>
}

export const disabledRewardService: RewardService = {
  enabled: false,
  async claim() {
    throw new Error('Real cryptocurrency rewards are disabled in this build.')
  },
}
