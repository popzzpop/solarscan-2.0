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
  export let monthlyKwhInput: number;
  export let energyCostPerKwhInput: number;
  export let panelCapacityWattsInput: number;
  export let dcToAcDerateInput: number;
  export let solarPanelConfigs: SolarPanelConfig[];
  export let defaultPanelCapacityWatts: number;
  export let updateKwhFromBill: () => void;
  export let updateBillFromKwh: () => void;

  const icon = 'payments';
  const title = 'Solar Potential analysis';

  let costChart: HTMLElement;
  let showAdvancedSettings = false;

  // [START solar_potential_calculations]
  // Basic settings - Updated for European market
  let monthlyAverageEnergyBill: number = 200; // €200 monthly average
  let energyCostPerKwh = 0.15; // €0.15/kWh (15 cents)
  let panelCapacityWatts = 450; // 450W panels
  let solarIncentives: number = 0; // No incentives default
  let installationCostPerWatt: number = 0.60; // €0.60/Watt
  let installationLifeSpan: number = 25; // 25 years (European standard)

  // Malta Feed-in Tariff rates (€/kWh)
  const fitWithGrant = 0.105; // €0.105/kWh with government grant
  const fitWithoutGrant = 0.15; // €0.15/kWh without government grant

  // BoV Financing terms
  const financingTermYears = 5;
  const financingAnnualInterestRate = 0.005; // 0.5% annual
  const financingMonthlyInterestRate = financingAnnualInterestRate / 12; // 0.04167%
  const financingTotalPayments = financingTermYears * 12; // 60 monthly payments

  // Advanced settings
  let dcToAcDerate = 0.85;
  let efficiencyDepreciationFactor = 0.995;
  let costIncreaseFactor = 1.022;
  let discountRate = 1.04;

  // Energy consumption
  let monthlyKwhEnergyConsumption: number = monthlyAverageEnergyBill / energyCostPerKwh;
  let yearlyKwhEnergyConsumption: number = monthlyKwhEnergyConsumption * 12;

  // Solar installation - will be calculated from config below
  let installationSizeKw: number = 0;
  let installationCostTotal: number = 0;

  // Energy produced for installation life span - will be calculated from config below
  let initialAcKwhPerYear: number = 0;
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

  // BoV Financing calculations
  $: financingMonthlyPayment = installationCostTotal > 0 ?
    (installationCostTotal * financingMonthlyInterestRate * Math.pow(1 + financingMonthlyInterestRate, financingTotalPayments)) /
    (Math.pow(1 + financingMonthlyInterestRate, financingTotalPayments) - 1) : 0;
  $: financingYearlyPayment = financingMonthlyPayment * 12; // Annual payment
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
    Math.max(yearlyKwhProduced - (monthlyKwhEnergyConsumption * 12), 0)
  );
  $: yearlyFitIncomeWithGrant = yearlyExcessEnergyKwh.map(excessEnergy =>
    excessEnergy * fitWithGrant
  );
  $: yearlyFitIncomeWithoutGrant = yearlyExcessEnergyKwh.map(excessEnergy =>
    excessEnergy * fitWithoutGrant
  );

  // Reactive utility bills with FIT applied annually
  $: yearlyUtilityBillEstimatesWithGrant = yearlyProductionAcKwh.map((yearlyKwhEnergyProduced, year) => {
    const billEnergyKwh = yearlyKwhEnergyConsumption - yearlyKwhEnergyProduced;
    const grossBill = (billEnergyKwh * energyCostPerKwhInput * costIncreaseFactor ** year);
    const fitIncome = yearlyFitIncomeWithGrant[year];
    const netBill = Math.max(grossBill - fitIncome, 0);
    return netBill / discountRate ** year;
  });

  $: yearlyUtilityBillEstimatesWithoutGrant = yearlyProductionAcKwh.map((yearlyKwhEnergyProduced, year) => {
    const billEnergyKwh = yearlyKwhEnergyConsumption - yearlyKwhEnergyProduced;
    const grossBill = (billEnergyKwh * energyCostPerKwhInput * costIncreaseFactor ** year);
    const fitIncome = yearlyFitIncomeWithoutGrant[year];
    const netBill = Math.max(grossBill - fitIncome, 0);
    return netBill / discountRate ** year;
  });

  $: totalFitIncomeWithGrant = yearlyFitIncomeWithGrant.reduce((sum, income, year) =>
    sum + (income / discountRate ** year), 0
  );
  $: totalFitIncomeWithoutGrant = yearlyFitIncomeWithoutGrant.reduce((sum, income, year) =>
    sum + (income / discountRate ** year), 0
  );
  $: remainingLifetimeUtilityBillWithGrant = yearlyUtilityBillEstimatesWithGrant.reduce((x, y) => x + y, 0);
  $: remainingLifetimeUtilityBillWithoutGrant = yearlyUtilityBillEstimatesWithoutGrant.reduce((x, y) => x + y, 0);
  $: totalCostWithSolarWithGrant = installationCostTotal + remainingLifetimeUtilityBillWithGrant - solarIncentives;
  $: totalCostWithSolarWithoutGrant = installationCostTotal + remainingLifetimeUtilityBillWithoutGrant - solarIncentives;
$: savingsWithGrant = totalCostWithoutSolar - totalCostWithSolarWithGrant + totalFitIncomeWithGrant;
$: savingsWithoutGrant = totalCostWithoutSolar - totalCostWithSolarWithoutGrant + totalFitIncomeWithoutGrant;

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

      // SIMPLIFIED NET METERING MODEL: Buy all consumption, sell all production
      // FIT income = solar_production × FIT_rate
      // Utility bill = consumption × electricity_price
      // Net yearly cost = utility_bill - FIT_income

      let cashFlowWithGrant = -installationCostTotal + solarIncentives; // Start with initial investment (negative)
      const cumulativeCashFlowWithGrant = yearlyProductionAcKwh.map((production, i) => {
        const fitIncome = production * fitWithGrant;
        const utilityBill = yearlyKwhEnergyConsumption * energyCostPerKwhInput * costIncreaseFactor ** i;
        const netCost = utilityBill - fitIncome;
        const discountedNetCost = netCost / discountRate ** i;
        cashFlowWithGrant -= discountedNetCost;
        return cashFlowWithGrant;
      });

      let cashFlowWithoutGrant = -installationCostTotal + solarIncentives; // Start with initial investment (negative)
      const cumulativeCashFlowWithoutGrant = yearlyProductionAcKwh.map((production, i) => {
        const fitIncome = production * fitWithoutGrant;
        const utilityBill = yearlyKwhEnergyConsumption * energyCostPerKwhInput * costIncreaseFactor ** i;
        const netCost = utilityBill - fitIncome;
        const discountedNetCost = netCost / discountRate ** i;
        cashFlowWithoutGrant -= discountedNetCost;
        return cashFlowWithoutGrant;
      });

      // BoV Financing scenario: High FIT + 5-year loan @ 0.5%
      let cashFlowWithFinancing = solarIncentives; // Start with no initial investment (financed)
      const cumulativeCashFlowWithFinancing = yearlyProductionAcKwh.map((production, i) => {
        const fitIncome = production * fitWithoutGrant; // Same High FIT rate
        const utilityBill = yearlyKwhEnergyConsumption * energyCostPerKwhInput * costIncreaseFactor ** i;
        const loanPayment = i < financingTermYears ? financingYearlyPayment : 0; // Loan payments for first 5 years
        const netCost = utilityBill + loanPayment - fitIncome;
        const discountedNetCost = netCost / discountRate ** i;
        cashFlowWithFinancing -= discountedNetCost;
        return cashFlowWithFinancing;
      });

      // DEBUG: Log chart data to see if curves are actually different
      console.log('=== CHART DATA DEBUG ===');
      console.log('Yearly Consumption:', yearlyKwhEnergyConsumption?.toFixed(0));
      console.log('Yearly Production:', yearlyProductionAcKwh[0]?.toFixed(0));
      console.log('Excess Energy[0]:', yearlyExcessEnergyKwh[0]?.toFixed(2));
      console.log('FIT With Grant[0]:', yearlyFitIncomeWithGrant[0]?.toFixed(2));
      console.log('FIT Without Grant[0]:', yearlyFitIncomeWithoutGrant[0]?.toFixed(2));
      console.log('Bill With Grant[0]:', yearlyUtilityBillEstimatesWithGrant[0]?.toFixed(2));
      console.log('Bill Without Grant[0]:', yearlyUtilityBillEstimatesWithoutGrant[0]?.toFixed(2));
      console.log('Year 5 Low Fit:', cumulativeCashFlowWithGrant[4]?.toFixed(2));
      console.log('Year 5 High Fit:', cumulativeCashFlowWithoutGrant[4]?.toFixed(2));
      console.log('=== END CHART DEBUG ===');

      let costWithoutSolar = 0;
      const cumulativeCostsWithoutSolar = yearlyCostWithoutSolar.map(
        (cost) => (costWithoutSolar += cost),
      );

      // Find break-even years (when cumulative cash flow becomes positive)
      breakEvenYearWithGrant = cumulativeCashFlowWithGrant.findIndex(
        (cashFlow) => cashFlow >= 0,
      );
      breakEvenYearWithoutGrant = cumulativeCashFlowWithoutGrant.findIndex(
        (cashFlow) => cashFlow >= 0,
      );

      const data = google.visualization.arrayToDataTable([
        ['Year', 'High Fit (€0.15/kWh)', 'Low Fit (€0.105/kWh)', 'High Fit + Financing', 'No Solar'],
        ...Array.from({ length: installationLifeSpan + 1 }, (_, i) => [
          i === 0 ? year.toString() : (year + i).toString(),
          i === 0 ? -installationCostTotal + solarIncentives : cumulativeCashFlowWithoutGrant[i - 1],
          i === 0 ? -installationCostTotal + solarIncentives : cumulativeCashFlowWithGrant[i - 1],
          i === 0 ? solarIncentives : cumulativeCashFlowWithFinancing[i - 1],
          i === 0 ? 0 : -cumulativeCostsWithoutSolar[i - 1],
        ]),
      ]);

      /* eslint-disable @typescript-eslint/no-explicit-any */
      const googleCharts = google.charts as any;
      const chart = new googleCharts.Line(costChart);
      const options = googleCharts.Line.convertOptions({
        title: `Cash Flow Analysis for ${installationLifeSpan} years`,
        width: 400,
        height: 250,
        colors: ['#00C853', '#1565C0', '#9C27B0', '#C62828'], // Green for High FIT, Blue for Low FIT, Purple for Financing, Red for No Solar
        legend: { position: 'bottom', textStyle: { fontSize: 9 }, maxLines: 2 },
        hAxis: { title: 'Year', titleTextStyle: { fontSize: 12 } },
        vAxis: { title: 'Net Cash Flow (€)', titleTextStyle: { fontSize: 12 } },
        chartArea: { width: '70%', height: '50%' },
      });
      chart.draw(data, options);
    },
    { packages: ['line'] },
  );

  function updateConfig() {
    monthlyKwhEnergyConsumption = monthlyKwhInput;
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
      onChange={() => { updateKwhFromBill(); updateConfig(); }}
    />

    <InputNumber
      bind:value={monthlyKwhInput}
      icon="electrical_services"
      label="Monthly kWh usage"
      suffix="kWh"
      onChange={() => { updateBillFromKwh(); updateConfig(); }}
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
              color: 'red',
            },
            {
              icon: 'request_quote',
              name: 'Solar installation cost',
              value: showMoney(installationCostTotal),
              color: 'red',
            },
            {
              icon: 'euro_symbol',
              name: 'Low FIT income (€0.105/kWh)',
              value: showMoney(totalFitIncomeWithGrant),
              color: 'green',
            },
            {
              icon: 'euro_symbol',
              name: 'High FIT income (€0.15/kWh)',
              value: showMoney(totalFitIncomeWithoutGrant),
              color: 'green',
            },
            {
              icon: 'trending_up',
              name: 'Savings with Low FIT (€0.105/kWh)',
              value: showMoney(savingsWithGrant),
              color: savingsWithGrant >= 0 ? 'green' : 'red',
            },
            {
              icon: 'trending_up',
              name: 'Savings with High FIT (€0.15/kWh)',
              value: showMoney(savingsWithoutGrant),
              color: savingsWithoutGrant >= 0 ? 'green' : 'red',
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
              color: (breakEvenYearWithGrant >= 0 || breakEvenYearWithoutGrant >= 0) ? 'green' : 'red',
            },
          ]}
        />
      </div>
    </div>
  {/if}
</div>
