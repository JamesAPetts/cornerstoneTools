import mixins from './../../mixins/index.js';
import { getLogger } from '../../util/logger.js';
import deepmerge from './../../util/deepmerge.js';

const logger = getLogger('tools:base:BaseTool');

/**
 * @typedef ToolConfiguration
 * @param {String} name
 * @param {object} strategies - Named strategy functions
 * @param {String} defaultStrategy - The name of the strategy to use by default
 * @param {Object} configuration
 * @param {String[]} mixins - A list of mixin names to apply to the tool
 */

/**
 * @memberof Tools.Base
 * @classdesc BaseTool Class description
 * @property {String[]} supportedInteractionTypes - A string list of ways the tool can interact with the user
 */
class BaseTool {
  /**
   * Constructor description
   * @param {props} [props={}] Tool properties set on instantiation of a tool
   * @param {defaultProps} [defaultProps={}] Tools Default properties
   */
  constructor(props, defaultProps) {
    /**
     * Merge default props with custom props
     */
    this.initialConfiguration = deepmerge(defaultProps, props);

    const {
      name,
      strategies,
      defaultStrategy,
      configuration,
      supportedInteractionTypes,
      mixins,
      svgCursor,
    } = this.initialConfiguration;

    /**
     * A unique, identifying tool name
     * @type {String}
     */
    this.name = name;

    /** @type {String} */
    this.mode = 'disabled';
    this.element = undefined;
    this.supportedInteractionTypes = supportedInteractionTypes || [];

    this.strategies = strategies || {};
    this.defaultStrategy =
      defaultStrategy || Object.keys(this.strategies)[0] || undefined;
    this.activeStrategy = this.defaultStrategy;

    if (svgCursor) {
      this.svgCursor = svgCursor;
    }

    // Options are set when a tool is added, during a "mode" change,
    // or via a tool's option's setter
    this._options = {};

    // Configuration is set at tool initalization
    this._configuration = Object.assign({}, configuration);

    // `updateOnMouseMove` causes the frame to render on every mouse move when
    // the tool is active. This is useful for tools that render large/dynamic
    // items to the canvas which can't easily be respresented with an SVG Cursor.
    this.updateOnMouseMove = false;
    this.hideDefaultCursor = false;

    // Apply mixins if mixinsArray is not empty.
    if (mixins && mixins.length) {
      this._applyMixins(mixins);
    }
  }

  //
  // CONFIGURATION
  //

  /**
   * Config...
   * @public
   * @type {Object}
   * @instance
   */
  static get configuration() {}

  get configuration() {
    return this._configuration;
  }

  set configuration(configuration) {
    this._configuration = configuration;
  }

  //
  // OPTIONS
  //

  /**
   * Options...
   * @readonly
   * @instance
   */
  get options() {
    return this._options;
  }

  /**
   * Merges provided options with existing options.
   *
   * @public
   * @instance
   * @param {Object} options - options object to merge with existing options.
   * @returns {undefined}
   */
  mergeOptions(options) {
    this._options = Object.assign({}, this._options, options);
  }

  /**
   * Clears the tools options.
   *
   * @public
   * @instance
   * @memberof Tools.Base.BaseTool
   * @returns {undefined}
   */
  clearOptions() {
    this._options = {};
  }

  /**
   * Apply the currently set/active strategy.
   *
   * @public
   * @instance
   * @method applyActiveStrategy
   * @memberof Tools.Base.BaseTool
   *
   * @param {Object} evt The event that triggered the strategies application
   * @param {Object} operationData - An object containing extra data not present in the `evt`,
   *                                 required to apply the strategy.
   * @returns {*} strategies vary widely; check each specific strategy to find expected return value
   */
  applyActiveStrategy(evt, operationData) {
    return this.strategies[this.activeStrategy](
      evt,
      this.configuration,
      operationData
    );
  }

  /**
   * Iterates over registered mixins; any matching names in the provided `mixinsArray` will
   * be merged with this instance.
   *
   * @private
   * @method _applyMixins
   * @param {string[]} mixinsArray An array of mixin identifiers (strings).
   * @returns {undefined}
   */
  _applyMixins(mixinsArray) {
    for (let i = 0; i < mixinsArray.length; i++) {
      const mixin = mixins[`${mixinsArray[i]}`];

      if (typeof mixin === 'object') {
        Object.assign(this, mixin);
      } else {
        logger.warn(`${this.name}: mixin ${mixins[i]} does not exist.`);
      }
    }
  }

  /**
   * Change the active strategy.
   *
   * @public
   * @method setActiveStrategy
   * @param  {string} strategy
   * @returns {null}
   */
  setActiveStrategy(strategy) {
    this.activeStrategy = strategy;
  }

  // ===================================================================
  // Virtual Methods - Have default behavior but may be overridden.
  // ===================================================================

  //
  // MOUSE
  //

  /**
   * Callback that takes priority if the tool is active, before `MOUSE_DOWN`
   * events are processed. Does nothing by default.
   *
   * @callback BaseTool~preMouseDownCallback
   * @param  {CornerstoneTools.event:cornerstonetoolsmousedown} evt
   * @returns {boolean} consumedEvent - True if function consumed the event.
   */
  /**
   * Callback that takes priority if the tool is active, after `MOUSE_DOWN`
   * events are processed. Does nothing by default.
   *
   * @callback BaseTool~postMouseDownCallback
   * @param  {CornerstoneTools.event:cornerstonetoolsmousedown} evt
   * @returns {boolean} consumedEvent - True if function consumed the event.
   */

  /**
   * Callback that is called if the tool is active, after `MOUSE_DOWN`
   * events are processed. Does nothing by default.
   *
   * @virtual
   * @param  {type} evt
   * @returns {boolean} consumedEvent - True if function consumed the event.
   */
  /**
   * Example implementation:
   *
   * postMouseDownCallback(evt) {
   *    return false;
   * }
   */

  /**
   * Callback that takes priority if the tool is active, before `TOUCH_START`
   * events are processed. Does nothing by default.
   *
   * @virtual
   * @param  {type} evt
   * @returns {boolean} consumedEvent - True if function consumed the event.
   */
  /**
   * Example implementation:
   *
   * preTouchStartCallback(evt) {
   *    return false;
   * }
   */

  /**
   * Callback that is called if the tool is active, after `TOUCH_START`
   * events are processed. Does nothing by default.
   *
   * @virtual
   * @param  {type} evt
   * @returns {boolean} consumedEvent - True if function consumed the event.
   */
  /**
   * Example implementation:
   *
   * postTouchStartCallback(evt) {
   *    return false;
   * }
   */
}

export default BaseTool;
