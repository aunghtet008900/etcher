/*
 * Copyright 2016 resin.io
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict'

const React = require('react')
const { render } = require('react-dom')
const propTypes = require('prop-types')
const _ = require('lodash')
const store = require('../../models/store')
const analytics = require('../../modules/analytics')
const settings = require('../../models/settings')
const { default: styled } = require('styled-components')
const { FaCog } = require('react-icons/fa')
const {
  Button,
  Checkbox,
  Modal,
  Provider
} = require('rendition')
const { colors } = require('../../theme')

const SettingsIcon = styled(FaCog) `
  &&& {
    color: ${colors.secondary.background}!important;
  }
`

class SettingsButton extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      hideModal: true
    }

    this.toggleModal = (show) => {
      this.setState({
        hideModal: !show
      })
    }
  }

  render () {
    return this.state.hideModal ? (
      <Provider>
        <Button
          icon={<SettingsIcon/>}
          plain
          onClick={() => this.toggleModal(true)}
          tabIndex="5">
        </Button>
      </Provider>
    ) : (
      <SettingsModal toggleModal={this.toggleModal}>
      </SettingsModal>
    )
  }
}

SettingsButton.propTypes = {}

class SettingsModal extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      currentData: settings.getAll()
    }
  }

  toggleSetting (setting, options) {
    const value = this.state.currentData[setting]
    const dangerous = !_.isUndefined(options)

    analytics.logEvent('Toggle setting', {
      setting,
      value,
      dangerous,
      applicationSessionUuid: store.getState().toJS().applicationSessionUuid
    })

    if (!dangerous) {
      settings.set(setting, !value)
      return this.setState({
        currentData: _.assign(this.state.currentData, {
          [setting]: !value
        })
      })
    }

    console.log('miao?')
    return render(
      <WarningModal
        message={options.description}
        confirmLabel={options.confirmLabel}
        done={() => {
          settings.set(setting, !value)
          this.setState({
            currentData: _.assign(this.state.currentData, {
              [setting]: true
            })
          })
        }}>
      </WarningModal>,
      document.getElementById('settings-modal')
    )
  }

  render () {
    return (
      <Provider>
        <Modal
          id='settings-modal'
          title='Settings'
          done={() => this.props.toggleModal(false)}
        >
          <div>
            <div>
              <Checkbox
                toggle
                tabIndex="6"
                label="Anonymously report errors and usage statistics to balena.io"
                checked={this.state.currentData.errorReporting}
                onChange={() => this.toggleSetting('errorReporting')}/>
            </div>

            <div>
              {
              // eslint-disable-next-line lines-around-comment
              /* On Windows, "Unmounting" basically means "ejecting".
              * On top of that, Windows users are usually not even
              * familiar with the meaning of "unmount", which comes
              * from the UNIX world. */
              }
              <Checkbox
                toggle
                tabIndex="7"
                label={`
                  ${settings.platform === 'win32' ? 'Eject' : 'Auto-unmount'} on success
                `}
                checked={this.state.currentData.unmountOnSuccess}
                onChange={() => this.toggleSetting('unmountOnSuccess')}/>
            </div>

            <div>
              <Checkbox
                toggle
                tabIndex="8"
                label="Validate write on success"
                checked={this.state.currentData.validateWriteOnSuccess}
                onChange={() => this.toggleSetting('validateWriteOnSuccess')}/>
            </div>

            <div>
              <Checkbox
                toggle
                tabIndex="9"
                label="Trim ext{2,3,4} partitions before writing (raw images only)"
                checked={this.state.currentData.trim}
                onChange={() => this.toggleSetting('trim')}/>
            </div>

            <div>
              <Checkbox
                toggle
                tabIndex="10"
                label="Auto-updates enabled"
                checked={this.state.currentData.updatesEnabled}
                onChange={() => this.toggleSetting('updatesEnabled')}/>
            </div>

            <div ng-if="settings.shouldShowUnsafeMode()">
              <Checkbox
                toggle
                tabIndex="11"
                label="Unsafe mode"
                checked={this.state.currentData.unsafeMode}
                onChange={() => this.toggleSetting('unsafeMode', {
                  description: `Are you sure you want to turn this on?
                    You will be able to overwrite your system drives if you're not careful.`,
                  confirmLabel: 'Enable unsafe mode'
                })}/>
              <span className="label label-danger">Dangerous</span>
            </div>
          </div>

          <WarningModal
            message={`Are you sure you want to turn this on?
            You will be able to overwrite your system drives if you're not careful.`}
            confirmLabel='Enable unsafe mode'>
          </WarningModal>

          {

            /* {this.state.showWarning ? (
              <WarningModal
                message={options.description}
                confirmLabel={options.confirmLabel}
                done={() => {
                  settings.set(setting, !value)
                  this.setState({
                    currentData: _.assign(this.state.currentData, {
                      [setting]: true
                    })
                  })
                }}>
              </WarningModal>
            ) : null} */
          }
        </Modal>
      </Provider>
    )
  }
}

SettingsModal.propTypes = {
  toggleModal: propTypes.func
}

const WarningModal = ({
  message,
  confirmLabel,
  done,
  cancel
}) => {
  return (
    <Provider>
      <Modal
        w='30%'
        title={confirmLabel}
        action={
          <div style={{ background: 'orange' }}>
            {confirmLabel}
          </div>
        }
        cancel={cancel}
        done={done}>
        {message}
      </Modal>
    </Provider>
  )
}

module.exports = { Settings: SettingsButton }
