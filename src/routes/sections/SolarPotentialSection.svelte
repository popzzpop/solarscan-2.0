<!--
 Copyright 2023 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 -->

<script lang="ts">
  /* global google */

  import { slide } from 'svelte/transition';

  import Expandable from '../components/Expandable.svelte';
  import SummaryCard from '../components/SummaryCard.svelte';
  import type { SolarPanelConfig } from '../solar';
  import Table from '../components/Table.svelte';

  /* eslint-disable @typescript-eslint/ban-ts-comment */
  // @ts-ignore
  import { GoogleCharts } from 'google-charts';
  import { findSolarConfig, showMoney, showNumber } from '../utils';
  import InputNumber from '../components/InputNumber.svelte';
  import InputPanelsCount from '../components/InputPanelsCount.svelte';
  import InputMoney from '../components/InputMoney.svelte';
  import InputPercent from '../components/InputPercent.svelte';
  import InputRatio from '../components/InputRatio.svelte';

  export let expandedSection: string;
  export let configId: number;
  export let monthlyAverageEnergyBillInput: number;
  export let energyCostPerKwhInput: number;
  export let panelCapacityWattsInput: number;
  export let dcToAcDerateInput: number;
  export let solarPanelConfigs: SolarPanelConfig[];
  export let defaultPanelCapacityWatts: number;

  const icon = 'payments';
  const title = 'Solar Potential analysis';

  let costChart: HTMLElement;
  let showAdvancedSettings = false;

  // [START solar_potential_calculations]
  // Solar configuration, from buildingInsights.solarPotential.solarPanelConfigs
  let panelsCount = 20;
  let yearlyEnergyDcKwh = 12000;

  // Basic settings - Updated for European market
  let monthlyAverageEnergyBill: number = 200; // €200 monthly average
  let energyCostPerKwh = 0.28; // €0.28/kWh (European average)
  let panelCapacityWatts = 400;
  let solarIncentives: number = 4000; // €4000 incentives (lower than US)
  let installationCostPerWatt: number = 2.5; // €2.50/Watt (European average)
  let installationLifeSpan: number = 25; // 25 years (European standard)

  // Malta Feed-in Tariff rates (€/kWh)
  const fitWithGrant = 0.105; // 10.5 cents with government grant
  const fitWithoutGrant = 0.15; // 15 cents without government grant

  // Advanced settings
  let dcToAcDerate = 0.85;
  let efficiencyDepreciationFactor = 0.995;
  let costIncreaseFactor = 1.022;
  let discountRate = 1.04;

  // Solar installation
  let installationSizeKw: number = (panelsCount * panelCapacityWatts) / 1000;
  let installationCostTotal: number = installationCostPerWatt * installationSizeKw * 1000;

  // Energy consumption
  let monthlyKwhEnergyConsumption: number = monthlyAverageEnergyBill / energyCostPerKwh;
  let yearlyKwhEnergyConsumption: number = monthlyKwhEnergyConsumption * 12;

  // Energy produced for installation life span
  let initialAcKwhPerYear: number = yearlyEnergyDcKwh * dcToAcDerate;
  let yearlyProductionAcKwh: number[] = [...Array(installationLifeSpan).keys()].map(
    (year) => initialAcKwhPerYear * efficiencyDepreciationFactor ** year,
  );

  // Cost with solar for installation life span
  let yearlyUtilityBillEstimates: number[] = yearlyProductionAcKwh.map(
    (yearlyKwhEnergyProduced, year) => {
      const billEnergyKwh = yearlyKwhEnergyConsumption - yearlyKwhEnergyProduced;
      const billEstimate =
        (billEnergyKwh * energyCostPerKwh * costIncreaseFactor ** year) / discountRate ** year;
      return Math.max(billEstimate, 0); // bill cannot be negative
    },
  );
  let remainingLifetimeUtilityBill: number = yearlyUtilityBillEstimates.reduce((x, y) => x + y, 0);
  let totalCostWithSolar: number =
    installationCostTotal + remainingLifetimeUtilityBill - solarIncentives;
  console.log(`Cost with solar: €${totalCostWithSolar.toFixed(2)}`);

  // Cost without solar for installation life span
  let yearlyCostWithoutSolar: number[] = [...Array(installationLifeSpan).keys()].map(
    (year) => (monthlyAverageEnergyBill * 12 * costIncreaseFactor ** year) / discountRate ** year,
  );
  let totalCostWithoutSolar: number = yearlyCostWithoutSolar.reduce((x, y) => x + y, 0);
  console.log(`Cost without solar: €${totalCostWithoutSolar.toFixed(2)}`);

  // Savings with solar for installation life span
  let savings: number = totalCostWithoutSolar - totalCostWithSolar;
  console.log(`Savings: €${savings.toFixed(2)} in ${installationLifeSpan} years`);

  // FIT calculations - Excess energy production and income
  let yearlyExcessEnergyKwh: number[] = yearlyProductionAcKwh.map(yearlyKwhProduced =>
    Math.max(yearlyKwhProduced - yearlyKwhEnergyConsumption, 0)
  );

  // FIT income calculations for both scenarios
  let yearlyFitIncomeWithGrant: number[] = yearlyExcessEnergyKwh.map(excessEnergy =>
    excessEnergy * fitWithGrant
  );

  let yearlyFitIncomeWithoutGrant: number[] = yearlyExcessEnergyKwh.map(excessEnergy =>
    excessEnergy * fitWithoutGrant
  );

  // Total FIT income discounted over lifetime
  let totalFitIncomeWithGrant: number = yearlyFitIncomeWithGrant.reduce((sum, income, year) =>
    sum + (income / discountRate ** year), 0
  );

  let totalFitIncomeWithoutGrant: number = yearlyFitIncomeWithoutGrant.reduce((sum, income, year) =>
    sum + (income / discountRate ** year), 0
  );

  // Total costs with FIT for both scenarios
  let totalCostWithSolarWithGrant: number = totalCostWithSolar - totalFitIncomeWithGrant;
  let totalCostWithSolarWithoutGrant: number = totalCostWithSolar - totalFitIncomeWithoutGrant;

  // Savings with FIT for both scenarios
  let savingsWithGrant: number = totalCostWithoutSolar - totalCostWithSolarWithGrant;
  let savingsWithoutGrant: number = totalCostWithoutSolar - totalCostWithSolarWithoutGrant;

  console.log(`FIT Income (with grant): €${totalFitIncomeWithGrant.toFixed(2)}`);
  console.log(`FIT Income (without grant): €${totalFitIncomeWithoutGrant.toFixed(2)}`);
  console.log(`Savings with grant: €${savingsWithGrant.toFixed(2)}`);
  console.log(`Savings without grant: €${savingsWithoutGrant.toFixed(2)}`);
  // [END solar_potential_calculations]

  // Reactive calculations
  let panelCapacityRatio: number = 1.0;
  $: panelCapacityRatio = panelCapacityWattsInput / defaultPanelCapacityWatts;
  $: installationCostTotal = installationCostPerWatt * installationSizeKw * 1000;
  $: if (solarPanelConfigs[configId]) {
    installationSizeKw = (solarPanelConfigs[configId].panelsCount * panelCapacityWattsInput) / 1000;
  }
  $: monthlyKwhEnergyConsumption = monthlyAverageEnergyBillInput / energyCostPerKwhInput;
  $: yearlyKwhEnergyConsumption = monthlyKwhEnergyConsumption * 12;
  $: if (solarPanelConfigs[configId]) {
    initialAcKwhPerYear =
      solarPanelConfigs[configId].yearlyEnergyDcKwh * panelCapacityRatio * dcToAcDerateInput;
  }
  $: yearlyProductionAcKwh = [...Array(installationLifeSpan).keys()].map(
    (year) => initialAcKwhPerYear * efficiencyDepreciationFactor ** year,
  );
  $: yearlyUtilityBillEstimates = yearlyProductionAcKwh.map((yearlyKwhEnergyProduced, year) => {
    const billEnergyKwh = yearlyKwhEnergyConsumption - yearlyKwhEnergyProduced;
    const billEstimate =
      (billEnergyKwh * energyCostPerKwhInput * costIncreaseFactor ** year) / discountRate ** year;
    return Math.max(billEstimate, 0); // bill cannot be negative
  });
  $: remainingLifetimeUtilityBill = yearlyUtilityBillEstimates.reduce((x, y) => x + y, 0);
  $: totalCostWithSolar = installationCostTotal + remainingLifetimeUtilityBill - solarIncentives;
  $: yearlyCostWithoutSolar = [...Array(installationLifeSpan).keys()].map(
    (year) =>
      (monthlyAverageEnergyBillInput * 12 * costIncreaseFactor ** year) / discountRate ** year,
  );
  $: totalCostWithoutSolar = yearlyCostWithoutSolar.reduce((x, y) => x + y, 0);
  $: savings = totalCostWithoutSolar - totalCostWithSolar;

  // Reactive FIT calculations
  $: yearlyExcessEnergyKwh = yearlyProductionAcKwh.map(yearlyKwhProduced =>
    Math.max(yearlyKwhProduced - yearlyKwhEnergyConsumption, 0)
  );
  $: yearlyFitIncomeWithGrant = yearlyExcessEnergyKwh.map(excessEnergy =>
    excessEnergy * fitWithGrant
  );
  $: yearlyFitIncomeWithoutGrant = yearlyExcessEnergyKwh.map(excessEnergy =>
    excessEnergy * fitWithoutGrant
  );
  $: totalFitIncomeWithGrant = yearlyFitIncomeWithGrant.reduce((sum, income, year) =>
    sum + (income / discountRate ** year), 0
  );
  $: totalFitIncomeWithoutGrant = yearlyFitIncomeWithoutGrant.reduce((sum, income, year) =>
    sum + (income / discountRate ** year), 0
  );
  $: totalCostWithSolarWithGrant = totalCostWithSolar - totalFitIncomeWithGrant;
  $: totalCostWithSolarWithoutGrant = totalCostWithSolar - totalFitIncomeWithoutGrant;
  $: savingsWithGrant = totalCostWithoutSolar - totalCostWithSolarWithGrant;
  $: savingsWithoutGrant = totalCostWithoutSolar - totalCostWithSolarWithoutGrant;

  let energyCovered: number;
  $: energyCovered = yearlyProductionAcKwh[0] / yearlyKwhEnergyConsumption;

  let breakEvenYear: number = -1;
  let breakEvenYearWithGrant: number = -1;
  let breakEvenYearWithoutGrant: number = -1;
  $: GoogleCharts.load(
    () => {
      if (!costChart) {
        return;
      }
      const year = new Date().getFullYear();

      // Calculate cumulative costs for original analysis (no FIT)
      let costWithSolar = 0;
      const cumulativeCostsWithSolar = yearlyUtilityBillEstimates.map(
        (billEstimate, i) =>
          (costWithSolar +=
            i == 0 ? billEstimate + installationCostTotal - solarIncentives : billEstimate),
      );

      // Calculate cumulative costs with FIT scenarios
      let costWithGrant = 0;
      const cumulativeCostsWithGrant = yearlyUtilityBillEstimates.map(
        (billEstimate, i) => {
          const netCost = i == 0 ? billEstimate + installationCostTotal - solarIncentives : billEstimate;
          const fitIncome = yearlyFitIncomeWithGrant[i] / discountRate ** i;
          return (costWithGrant += netCost - fitIncome);
        },
      );

      let costWithoutGrant = 0;
      const cumulativeCostsWithoutGrant = yearlyUtilityBillEstimates.map(
        (billEstimate, i) => {
          const netCost = i == 0 ? billEstimate + installationCostTotal - solarIncentives : billEstimate;
          const fitIncome = yearlyFitIncomeWithoutGrant[i] / discountRate ** i;
          return (costWithoutGrant += netCost - fitIncome);
        },
      );

      let costWithoutSolar = 0;
      const cumulativeCostsWithoutSolar = yearlyCostWithoutSolar.map(
        (cost) => (costWithoutSolar += cost),
      );

      // Find break-even years
      breakEvenYear = cumulativeCostsWithSolar.findIndex(
        (costWithSolar, i) => costWithSolar <= cumulativeCostsWithoutSolar[i],
      );
      breakEvenYearWithGrant = cumulativeCostsWithGrant.findIndex(
        (costWithGrant, i) => costWithGrant <= cumulativeCostsWithoutSolar[i],
      );
      breakEvenYearWithoutGrant = cumulativeCostsWithoutGrant.findIndex(
        (costWithoutGrant, i) => costWithoutGrant <= cumulativeCostsWithoutSolar[i],
      );

      const data = google.visualization.arrayToDataTable([
        ['Year', 'FIT (with grant)', 'FIT (without grant)', 'Solar (no FIT)', 'No solar'],
        ...Array.from({ length: installationLifeSpan + 1 }, (_, i) => [
          i === 0 ? year.toString() : (year + i).toString(),
          i === 0 ? 0 : cumulativeCostsWithGrant[i - 1],
          i === 0 ? 0 : cumulativeCostsWithoutGrant[i - 1],
          i === 0 ? 0 : cumulativeCostsWithSolar[i - 1],
          i === 0 ? 0 : cumulativeCostsWithoutSolar[i - 1],
        ]),
      ]);

      /* eslint-disable @typescript-eslint/no-explicit-any */
      const googleCharts = google.charts as any;
      const chart = new googleCharts.Line(costChart);
      const options = googleCharts.Line.convertOptions({
        title: `Cost analysis for ${installationLifeSpan} years`,
        width: 400,
        height: 200,
        colors: ['#00C853', '#1565C0', '#FF6F00', '#C62828'], // Green for grant, Blue for no grant, Orange for no FIT, Red for no solar
        legend: { position: 'bottom', textStyle: { fontSize: 10 } },
        hAxis: { title: 'Year', titleTextStyle: { fontSize: 12 } },
        vAxis: { title: 'Cumulative Cost (€)', titleTextStyle: { fontSize: 12 } },
        chartArea: { width: '70%', height: '60%' },
      });
      chart.draw(data, options);
    },
    { packages: ['line'] },
  );

  function updateConfig() {
    monthlyKwhEnergyConsumption = monthlyAverageEnergyBillInput / energyCostPerKwhInput;
    yearlyKwhEnergyConsumption = monthlyKwhEnergyConsumption * 12;
    panelCapacityRatio = panelCapacityWattsInput / defaultPanelCapacityWatts;
    configId = findSolarConfig(
      solarPanelConfigs,
      yearlyKwhEnergyConsumption,
      panelCapacityRatio,
      dcToAcDerateInput,
    );
  }
</script>

<Expandable
  bind:section={expandedSection}
  {icon}
  {title}
  subtitle="Values are only placeholders."
  subtitle2="Update with your own values."
  secondary
>
  <div class="flex flex-col space-y-4 pt-1">
    <div class="p-4 mb-4 surface-variant outline-text rounded-lg">
      <p class="relative inline-flex items-center space-x-2">
        <md-icon class="md:w-6 w-8">info</md-icon>
        <span>
          Projections use European market values
          <a
            class="primary-text"
            href="https://developers.google.com/maps/documentation/solar/calculate-costs-typescript"
            target="_blank"
          >
            adapted for EU markets
            <md-icon class="text-sm">open_in_new</md-icon>
          </a>
        </span>
      </p>
    </div>

    <InputMoney
      bind:value={monthlyAverageEnergyBillInput}
      icon="credit_card"
      label="Monthly average energy bill"
      onChange={updateConfig}
    />

    <div class="inline-flex items-center space-x-2">
      <div class="grow">
        <InputPanelsCount bind:configId {solarPanelConfigs} />
      </div>
      <md-icon-button role={undefined} on:click={updateConfig}>
        <md-icon>sync</md-icon>
      </md-icon-button>
    </div>

    <InputMoney
      bind:value={energyCostPerKwhInput}
      icon="paid"
      label="Energy cost per kWh"
      onChange={updateConfig}
    />

    <InputMoney
      bind:value={solarIncentives}
      icon="redeem"
      label="Solar incentives"
      onChange={updateConfig}
    />

    <InputMoney
      bind:value={installationCostPerWatt}
      icon="request_quote"
      label="Installation cost per Watt"
      onChange={updateConfig}
    />

    <InputNumber
      bind:value={panelCapacityWattsInput}
      icon="bolt"
      label="Panel capacity"
      suffix="Watts"
      onChange={updateConfig}
    />

    <div class="flex flex-col items-center w-full">
      <md-text-button
        trailing-icon
        role={undefined}
        on:click={() => (showAdvancedSettings = !showAdvancedSettings)}
      >
        {showAdvancedSettings ? 'Hide' : 'Show'} advanced settings
        <md-icon slot="icon">
          {showAdvancedSettings ? 'expand_less' : 'expand_more'}
        </md-icon>
      </md-text-button>
    </div>

    {#if showAdvancedSettings}
      <div class="flex flex-col space-y-4" transition:slide={{ duration: 200 }}>
        <InputNumber
          bind:value={installationLifeSpan}
          icon="date_range"
          label="Installation lifespan"
          suffix="years"
          onChange={updateConfig}
        />

        <InputPercent
          bind:value={dcToAcDerateInput}
          icon="dynamic_form"
          label="DC to AC conversion "
          onChange={updateConfig}
        />

        <InputRatio
          bind:value={efficiencyDepreciationFactor}
          icon="trending_down"
          label="Panel efficiency decline per year"
          decrease
          onChange={updateConfig}
        />

        <InputRatio
          bind:value={costIncreaseFactor}
          icon="price_change"
          label="Energy cost increase per year"
          onChange={updateConfig}
        />

        <InputRatio
          bind:value={discountRate}
          icon="local_offer"
          label="Discount rate per year"
          onChange={updateConfig}
        />
      </div>
    {/if}

    <div class="grid justify-items-end">
      <md-filled-tonal-button
        trailing-icon
        role={undefined}
        href="https://developers.google.com/maps/documentation/solar/calculate-costs-typescript"
        target="_blank"
      >
        More details
        <md-icon slot="icon">open_in_new</md-icon>
      </md-filled-tonal-button>
    </div>
  </div>
</Expandable>

<div class="absolute top-0 left-0">
  {#if expandedSection == title}
    <div class="flex flex-col space-y-2 m-2">
      <SummaryCard
        {icon}
        {title}
        rows={[
          {
            icon: 'energy_savings_leaf',
            name: 'Yearly energy',
            value: showNumber(
              (solarPanelConfigs[configId]?.yearlyEnergyDcKwh ?? 0) * panelCapacityRatio,
            ),
            units: 'kWh',
          },
          {
            icon: 'speed',
            name: 'Installation size',
            value: showNumber(installationSizeKw),
            units: 'kW',
          },
          {
            icon: 'request_quote',
            name: 'Installation cost',
            value: showMoney(installationCostTotal),
          },
          {
            icon: [
              'battery_0_bar',
              'battery_1_bar',
              'battery_2_bar',
              'battery_3_bar',
              'battery_4_bar',
              'battery_5_bar',
              'battery_full',
            ][Math.floor(Math.min(Math.round(energyCovered * 100) / 100, 1) * 6)],
            name: 'Energy covered',
            value: Math.round(energyCovered * 100).toString(),
            units: '%',
          },
        ]}
      />
    </div>

    <div class="mx-2 p-4 surface on-surface-text rounded-lg shadow-lg">
      <div bind:this={costChart} />
      <div class="w-full secondary-text">
        <Table
          rows={[
            {
              icon: 'wallet',
              name: 'Cost without solar',
              value: showMoney(totalCostWithoutSolar),
            },
            {
              icon: 'wb_sunny',
              name: 'Cost with solar (no FIT)',
              value: showMoney(totalCostWithSolar),
            },
            {
              icon: 'savings',
              name: 'Savings (no FIT)',
              value: showMoney(savings),
            },
            {
              icon: 'euro_symbol',
              name: 'FIT income (with grant)',
              value: showMoney(totalFitIncomeWithGrant),
            },
            {
              icon: 'euro_symbol',
              name: 'FIT income (without grant)',
              value: showMoney(totalFitIncomeWithoutGrant),
            },
            {
              icon: 'trending_up',
              name: 'Savings with FIT (grant)',
              value: showMoney(savingsWithGrant),
            },
            {
              icon: 'trending_up',
              name: 'Savings with FIT (no grant)',
              value: showMoney(savingsWithoutGrant),
            },
            {
              icon: 'balance',
              name: 'Break even',
              value:
                breakEvenYearWithGrant >= 0
                  ? `${breakEvenYearWithGrant + new Date().getFullYear() + 1} (${breakEvenYearWithGrant + 1}y)`
                  : breakEvenYearWithoutGrant >= 0
                  ? `${breakEvenYearWithoutGrant + new Date().getFullYear() + 1} (${breakEvenYearWithoutGrant + 1}y)`
                  : '--',
              units: 'years',
            },
          ]}
        />
      </div>
    </div>
  {/if}
</div>
