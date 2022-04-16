import { CheckCircleTwoTone, CloseCircleTwoTone, MinusCircleTwoTone } from '@ant-design/icons'
import { Button, Spin, Tooltip } from 'antd'
import Label from 'components/Label'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import useGov from '../../../hooks/gov/useGov'
import { useParams } from 'react-router-dom'
import useGovDetailInfo from '../../../hooks/gov/useGovDetailInfo'
import { formatAmount } from '@funcblock/dapp-sdk'
import { HelpCircle } from 'react-feather'
import { useEthers } from '@usedapp/core'
import useStakeInfo from '../../../hooks/staking/useStakeInfo'
import useGovDetailVotes from '../../../hooks/gov/useGovDetailVotes'

export default function VoteSection() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const { myCanVote, state, myReward } = useGovDetailInfo(id)
  const { myStakeBalance } = useStakeInfo()

  function getPanel() {
    if (state === 'Defeated' || state === 'Succeeded') {
      return <ClaimRewardPanel id={id} myReward={myReward} />
    }
    if (state === 'Invalid' || state === 'Refunded') {
      return <InvalidPanel id={id} state={state} />
    }
    return <ActionPanel id={id} canVote={myCanVote && myStakeBalance?.gt(0)} />
  }

  return (
    <div className="flex-1 flex flex-col md:mr-4">
      <Label text={t('vote')} />
      <div className="mt-6 flex flex-col justify-center p-10 flex-1 rounded-lg shadow">
        {getPanel()}
      </div>
    </div>
  )
}

function ActionPanel({ id, canVote }) {
  const { onVote } = useGov()
  const { account } = useEthers()
  const { myVotes } = useGovDetailInfo(id)
  const { voteRecords, reloadVoteRecords } = useGovDetailVotes(id)
  const { myStakeBalance } = useStakeInfo()
  const { t } = useTranslation()
  const myVoted = voteRecords?.find(i => i.voter === account && i.proposalId === id)
  const onSubmit = useCallback(async (id, support) => {
    await onVote(id, support)
    setTimeout(reloadVoteRecords, 1000)
  }, [onVote, reloadVoteRecords])

  const myVotesBN = myVotes?.gt(0) ? myVotes : myStakeBalance

  return <Spin spinning={!voteRecords}>
    <div className="flex flex-col justify-center items-stretch">
      <div className="mb-2 text-center text-dark-gray">My {myVotes ? 'votes' : 'staking'}: {formatAmount(myVotesBN, 18)} KOGE</div>
      <Button
        className={`bg-white h-12 text-light-black text-xl font-bold ${myVoted?.support === '1' && 'border-primary'}`}
        icon={<CheckCircleTwoTone twoToneColor="#08C849" className="align-baseline" />}
        onClick={() => !myVoted && onSubmit(id, 1)}
        disabled={!canVote || myVoted}
      >
        {t('approve_vote')}
      </Button>
      <Button
        className={`bg-white mt-6 h-12 text-light-black text-xl font-bold ${myVoted?.support === '0' && 'border-primary'}`}
        icon={<CloseCircleTwoTone twoToneColor="#EF2B2B" className="align-baseline" />}
        onClick={() => !myVoted && onSubmit(id, 0)}
        disabled={!canVote || myVoted}
      >
        {t('reject_vote')}
      </Button>
    </div>
  </Spin>
}


function ClaimRewardPanel({ id, myReward }) {
  const { onClaim } = useGov()
  const { t } = useTranslation()

  return <div className="flex flex-col items-center">
    <CheckCircleTwoTone className="md:pb-7" style={{ fontSize: '52px' }} twoToneColor="#08C849" />
    <div className="mb-4 text-lg font-bold">{t('vote_success_desc')}</div>
    {
      myReward.gt(0) && (
        <Button
          className="my-4 h-12 md:h-10 bg-primary text-black border-none rounded text-sm"
          onClick={() => onClaim(id)}
        >
          {t('claim')} {formatAmount(myReward, 18)} KOGE
        </Button>
      )
    }
  </div>
}


function InvalidPanel({ id, state }) {
  const { onRefund } = useGov()
  const { t } = useTranslation()

  return <div className="flex flex-col justify-center items-center">
    <MinusCircleTwoTone className="md:pb-7" style={{ fontSize: '52px' }} twoToneColor="#A9A9A9" />
    <div className="mb-4 text-lg font-bold">The proposal is invalid</div>
    {
      state === 'Invalid' && (
        <Button
          className="my-4 h-12 md:h-10 bg-primary text-black flex flex-row items-center border-none rounded text-sm"
          onClick={() => onRefund(id)}
        >
          <div className="mr-1">{t('close')}</div>
          <Tooltip className="opacity-50" placement="top"
                   title="Closing invalid proposal will be rewarded">
            <HelpCircle size={16} />
          </Tooltip>
        </Button>
      )
    }
  </div>
}


