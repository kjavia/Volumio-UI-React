import Button from './components/Button';

const App = () => {
    return (
        <div classNameName="container-fluid">
            <div classNameName="row">
                <div classNameName="col-12">
                    <h1>Volumio UI React</h1>
                    <div classNameName="my-5">
                        <div className="settings-panel">
                            <div className="panel-header">
                                <h1>System Configuration</h1>
                                <span className="material-icons" style={{ color: '#555' }}>
                                    settings
                                </span>
                            </div>

                            <form>
                                {/* <!-- SECTION 1: NETWORK --> */}
                                <div className="form-section">
                                    <div className="section-title">Network Settings</div>

                                    {/* <!-- Text Input --> */}
                                    <div className="form-group">
                                        <div>
                                            <label for="device-name">Device Name</label>
                                            <span className="input-desc">
                                                Network identifier for this player
                                            </span>
                                        </div>
                                        <input
                                            type="text"
                                            id="device-name"
                                            className="input-field"
                                            value="Volumio-LivingRoom"
                                            placeholder="Enter name..."
                                        />
                                    </div>

                                    {/* <!-- Select Dropdown --> */}
                                    <div className="form-group">
                                        <div>
                                            <label for="wifi-network">Wi-Fi Network</label>
                                            <span className="input-desc">
                                                Select primary connection point
                                            </span>
                                        </div>
                                        <div className="select-wrapper">
                                            <select id="wifi-network" className="select-field">
                                                <option value="net_5g">SkyNet_5GHz</option>
                                                <option value="net_24g">SkyNet_Legacy</option>
                                                <option value="guest">Guest_Network</option>
                                            </select>
                                            <span className="material-icons select-arrow">
                                                arrow_drop_down
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* <!-- SECTION 2: AUDIO --> */}
                                <div className="form-section">
                                    <div className="section-title">Audio Output</div>

                                    {/* <!-- Checkbox (Switch) --> */}
                                    <div className="form-group">
                                        <div>
                                            <label>Analog Output</label>
                                            <span className="input-desc">
                                                Enable RCA/Jack output stages
                                            </span>
                                        </div>
                                        <label className="toggle-switch">
                                            <input type="checkbox" checked />
                                            <span className="slider"></span>
                                        </label>
                                    </div>

                                    {/* <!-- Checkbox (Switch) --> */}
                                    <div className="form-group">
                                        <div>
                                            <label>Digital Optical</label>
                                            <span className="input-desc">
                                                Enable Toslink output (Max 96kHz)
                                            </span>
                                        </div>
                                        <label className="toggle-switch">
                                            <input type="checkbox" />
                                            <span className="slider"></span>
                                        </label>
                                    </div>

                                    {/* <!-- Radio Buttons --> */}
                                    <div className="form-group stacked">
                                        <label>Output Quality</label>
                                        <div className="radio-group">
                                            <label className="radio-option">
                                                <input type="radio" name="quality" value="16bit" />
                                                <span className="checkmark"></span>
                                                16-bit / 44.1kHz
                                            </label>
                                            <label className="radio-option">
                                                <input
                                                    type="radio"
                                                    name="quality"
                                                    value="24bit"
                                                    checked
                                                />
                                                <span className="checkmark"></span>
                                                24-bit / 96kHz
                                            </label>
                                            <label className="radio-option">
                                                <input type="radio" name="quality" value="DSD" />
                                                <span className="checkmark"></span>
                                                DSD Direct
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* <!-- SECTION 3: Account --> */}
                                <div className="form-section">
                                    <div className="section-title">Account</div>
                                    {/* <!-- Password Input --> */}
                                    <div className="form-group">
                                        <label for="api-key">API Key</label>
                                        <input
                                            type="password"
                                            id="api-key"
                                            className="input-field"
                                            value="dk29s-293d-293s"
                                            readonly
                                        />
                                    </div>
                                </div>

                                {/* <!-- ACTIONS --> */}
                                <div className="form-actions">
                                    <button type="button" className="btn btn-cancel">
                                        Discard
                                    </button>
                                    <button type="button" className="btn btn-submit">
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;
