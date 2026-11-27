import { describe, it, expect } from "vitest";

import type DashboardConfig from "./dashboard";
import {
  getDashboardWithAppliedWidget,
  getDashboardWithoutWidgetBranch,
  findRootConfig,
  isRootConfig,
} from "./dashboard";
import type WidgetConfig from "./widget";

describe("Unit test dashboard functionality", () => {
  testWidgetAppliedToEmptyDashboardBecomesRoot();
  testWidgetAppliedWithoutItemConfigBecomesRoot();
  testWidgetCanBeRemoved();

	testRootCanBeFound();
	testWidgetCanBeCheckedToBeRoot();
});

function testWidgetAppliedToEmptyDashboardBecomesRoot() {
  it("Widget applied to empty dashboard becomes its root", () => {
    const { initial, widgetToApply, expected } =
      getWidgetAppliedToEmptyDashboardBecomesRootTestSetup();
    const result = getDashboardWithAppliedWidget(initial, widgetToApply);
    expect(result).toStrictEqual(expected);
  });
}

function testWidgetAppliedWithoutItemConfigBecomesRoot() {
  it("Widget applied without item config becomes root", () => {
    const { initial, widgetToApply, expected } =
      getWidgetAppliedWithoutItemConfigBecomesRootTestSetup();
    const result = getDashboardWithAppliedWidget(initial, widgetToApply);
    expect(result).toStrictEqual(expected);
  });
}

function testWidgetCanBeRemoved() {
  it("Widget can be removed", () => {
    const { initial, widgetToRemove, expected } = getWidgetCanBeRemovedTestSetup();
    const result = getDashboardWithoutWidgetBranch(initial, widgetToRemove);
    expect(result).toStrictEqual(expected);
  });
}

function testRootCanBeFound() {
  it("Root can be found", () => {
    const { dashboard, expected } = getRootCanBeFoundTestSetup();
		const deps = { dashboard };
    const result = findRootConfig(deps);
    expect(result).toStrictEqual(expected);
  });
}

function testWidgetCanBeCheckedToBeRoot() {
  it("Root can be found", () => {
    const { dashboard, root, notRoot} = getWidgetCanBeCheckedToBeRootTestSetup();
		const deps = { dashboard };
    const rightResult = isRootConfig(root, deps);
		const wrongResult = isRootConfig(notRoot, deps);
    expect(rightResult).toStrictEqual(true);
		expect(wrongResult).toStrictEqual(false);
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
    widgetConfigs: { [widgetToApply.id]: widgetToApply },
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
    widgetConfigs: { [widgetToApply.id]: widgetToApply },
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
    children: ["2"],
  };

  const widgetToRemove: WidgetConfig = {
    id: "2",
    parentId: "1",
    type: "layout",
    layout: "absolute",
  };

  const initial: DashboardConfig = {
    widgetConfigs: {
      [root.id]: root,
      [widgetToRemove.id]: widgetToRemove,
    },
    rootId: root.id,
  };

  const expected: DashboardConfig = {
    widgetConfigs: { [root.id]: { ...root, children: [] } },
    rootId: root.id,
  };

  return { initial, widgetToRemove, expected };
}

function getRootCanBeFoundTestSetup() {
	const root: WidgetConfig = {
    id: "1",
    type: "layout",
    layout: "absolute",
  };

  const dashboard: DashboardConfig = {
    widgetConfigs: {[root.id]: root},
		rootId: root.id,
  };

  return { dashboard, expected: root };
}

function getWidgetCanBeCheckedToBeRootTestSetup() {
	const root: WidgetConfig = {
    id: "1",
    type: "layout",
    layout: "absolute",
  };

	const child: WidgetConfig = {
		id: "2",
    parentId: "1",
    type: "layout",
    layout: "absolute",
	}

  const dashboard: DashboardConfig = {
    widgetConfigs: {[root.id]: root, [child.id]: child},
		rootId: root.id,
  };

  return { dashboard, root, notRoot: child };
}
