import { describe, it, expect } from 'vitest';
import DashboardConfig, { getDashboardWithAppliedWidget, getDashboardWithoutWidgetBranch, findRootConfig, isRootConfig } from './dashboard';
import WidgetConfig from './widget';

describe('Unit test dashboard functionality', () => {
	testWidgetAppliedToEmptyDashboardBecomesRoot();
	testWidgetAppliedWithoutItemConfigBecomesRoot();
	testWidgetCanBeRemoved();
});

function testWidgetAppliedToEmptyDashboardBecomesRoot() {
	it('Widget applied to empty dashboard becomes its root', () => {
		const { initial, widgetToApply, expected } = getWidgetAppliedToEmptyDashboardBecomesRootTestSetup();
		const result = getDashboardWithAppliedWidget(initial, widgetToApply);
    expect(result).toStrictEqual(expected);
  });
}

function testWidgetAppliedWithoutItemConfigBecomesRoot() {
	it('Widget applied without item config becomes root', () => {
		const { initial, widgetToApply, expected } = getWidgetAppliedWithoutItemConfigBecomesRootTestSetup();
		const result = getDashboardWithAppliedWidget(initial, widgetToApply);
    expect(result).toStrictEqual(expected);
  });
}

function testWidgetCanBeRemoved() {
	it('Widget can be removed', () => {
		const { initial, widgetToRemove, expected } = getWidgetCanBeRemovedTestSetup();
		const result = getDashboardWithoutWidgetBranch(initial, widgetToRemove);
    expect(result).toStrictEqual(expected);
  });
}

function getWidgetAppliedToEmptyDashboardBecomesRootTestSetup() {
	const initial: DashboardConfig = {
		widgetConfigs: {},
	};

	const widgetToApply: WidgetConfig = {
		id: "1",
		type: "layout",
		layout: "absolute",
	};

	const expected: DashboardConfig = {
		widgetConfigs: {[widgetToApply.id]: widgetToApply},
		rootId: widgetToApply.id,
	};

	return { initial, widgetToApply, expected };
}

function getWidgetAppliedWithoutItemConfigBecomesRootTestSetup() {
	const initial: DashboardConfig = {
		widgetConfigs: {
			"1": {
				id: "1",
				type: "layout",
				layout: "absolute",
			},
		},
		rootId: "1",
	};

	const widgetToApply: WidgetConfig = {
		id: "2",
		type: "layout",
		layout: "absolute",
	};

	const expected: DashboardConfig = {
		widgetConfigs: {[widgetToApply.id]: widgetToApply},
		rootId: widgetToApply.id,
	};

	return { initial, widgetToApply, expected };
}

function getWidgetCanBeRemovedTestSetup() {
	const root: WidgetConfig = {
		id: "1",
		type: "layout",
		layout: "absolute",
		arrangement: {},
		children: ["2"]
	}

	const widgetToRemove: WidgetConfig = {
		id: "2",
		parentId: "1",
		type: "layout",
		layout: "absolute",
	};

	const initial: DashboardConfig = {
		widgetConfigs: {
			[root.id]: root,
			[widgetToRemove.id]: widgetToRemove
		},
		rootId: root.id,
	};

	const expected: DashboardConfig = {
		widgetConfigs: {[root.id]: { ...root, children: [] }},
		rootId: root.id,
	};

	return { initial, widgetToRemove, expected };
}
