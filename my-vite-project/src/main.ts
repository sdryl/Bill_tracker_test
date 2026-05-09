import "./style.css";

abstract class Bill {
  // NOTE: Private fields
  private _id: string;
  private _name: string;
  private _amount: number;

  constructor(id: string, name: string, baseAmount: number) {
    this._id = id;
    this._name = name;
    this._amount = baseAmount;
  }

  // NOTE: Basic getters and setters
  public get id(): string {
    return this._id;
  }

  public get name(): string {
    return this._name;
  }

  public get amount(): number {
    return this._amount;
  }

  public set name(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error("Name cannot be empty");
    } else {
      this._name = value;
    }
  }

  public set amount(value: number) {
    if (value < 0) {
      throw new Error("Amount cannot be negative");
    } else {
      this._amount = value;
    }
  }

  // NOTE: Abstract methods
  public abstract monthlyImpact(): number;
  public abstract priority(): number;
  public abstract getBillTypeLabel(): string;
}

// NOTE: Subscription classes
abstract class Subscription extends Bill {
  private _billingCycle: "monthly" | "annual";
  
  constructor(id: string, name: string, baseAmount: number, billingCycle: "monthly" | "annual") {
    super(id, name, baseAmount);
    this._billingCycle = billingCycle;
  }
  
  public get billingCycle(): "monthly" | "annual" {
    return this._billingCycle;
  }

  public monthlyImpact(): number {
    return this.billingCycle === "annual" ? this.amount / 12 : this.amount;
  }
}

class EntertainmentSubscription extends Subscription {
  public priority(): number {
    return 2;
  }

  public getBillTypeLabel(): string {
    return "Entertainment";
  }
}

class ProductivitySubscription extends Subscription {
  public priority(): number {
    return 3;
  }

  public getBillTypeLabel(): string {
    return "Productivity";
  }
}

// NOTE: Utility classes
abstract class Utility extends Bill {
  public monthlyImpact(): number {
    return this.amount;
  }
}

class EssentialUtility extends Utility {
  public priority(): number {
    return 5;
  }

  public getBillTypeLabel(): string {
    return "Essential";
  }
}

class NonEssentialUtility extends Utility {
  public priority(): number {
    return 1;
  }

  public getBillTypeLabel(): string {
    return "Non-essential";
  }
}

// NOTE: Debt classes
abstract class Debt extends Bill {
  private _interestRate: number;

  constructor(id: string, name: string, baseAmount: number, interestRate: number) {
    super(id, name, baseAmount);
    this._interestRate = interestRate;  
  }

  public get interestRate(): number {
    return this._interestRate;
  }

  public set interestRate(value: number){
    if (value < 0) {
      throw new Error("Interest rate cannot be negative");
    } else {
      this._interestRate = value;
    }
  }

  public monthlyImpact(): number {
    return this.amount + (this.amount * this.interestRate / 100);
  }
}
class OneTimeDebt extends Debt {
  public priority(): number {
    return 4;
  }

  public getBillTypeLabel(): string {
    return "One-time";
  }
}

class RecurringDebt extends Debt {
  public priority(): number {
    return 5;
  }

  public getBillTypeLabel(): string {
    return "Recurring";
  }
}

type CategoryGroup = {
  label: string;
  items: Bill[];
};

// NOTE: Manager class
class BillManager {
  // NOTE: Private fields
  private groups: CategoryGroup[];
  private _totalBudget: number = 0;
  private _categoryBudgets: Record<string, number> = {
    "Subscriptions": 0,
    "Utilities": 0,
    "Debts": 0,
  };

  constructor(groups: CategoryGroup[]) {
    this.groups = groups;
  }

  // NOTE: Public methods
  public getGroups(): CategoryGroup[] {
    return this.groups;
  }

  public setBudgets(total: number, subs: number, utils: number, debts: number): void {
    this._totalBudget = total;
    this._categoryBudgets["Subscriptions"] = subs;
    this._categoryBudgets["Utilities"] = utils;
    this._categoryBudgets["Debts"] = debts;
  }

  public get totalBudget(): number {
    return this._totalBudget;
  }

  public getCategoryBudget(category: string): number {
    return this._categoryBudgets[category] || 0;
  }

  // NOTE: Methods
   public createBill(
    billType: string, 
    id: string, 
    name: string, 
    amount: number, 
    billingCycle: "monthly" | "annual" = "monthly", 
    interestRate: number
  ): Bill {
    switch (billType) {
      case "ProductivitySubscription":
        return new ProductivitySubscription(id, name, amount, billingCycle);
      case "EntertainmentSubscription":
        return new EntertainmentSubscription(id, name, amount, billingCycle);
      case "EssentialUtility":
        return new EssentialUtility(id, name, amount);
      case "NonEssentialUtility":
        return new NonEssentialUtility(id, name, amount);
      case "OneTimeDebt":
        return new OneTimeDebt(id, name, amount, interestRate);
      case "RecurringDebt":
        return new RecurringDebt(id, name, amount, interestRate);
      default:
        throw new Error(`Unknown bill type: ${billType}`);
    }
  }

  public addToGroup(label: string, bill: Bill): void {
    const group = this.groups.find((item) => item.label === label);
    if (group) {
      group.items.push(bill);
    }
  }

  public removeFromGroup(label: string, billId: string): void {
    const group = this.groups.find((item) => item.label === label);
    if (group) {
      group.items = group.items.filter((item) => item.id !== billId);
    }
  }

  public getTotal(): number {
    return this.groups
      .flatMap((group) => group.items)
      .reduce((sum, item) => sum + item.monthlyImpact(), 0);
  }
  
  public getBillTypeLabel(bill: Bill): string {
    switch (bill.constructor.name) {
      case "EntertainmentSubscription":
        return "Entertainment";
      case "ProductivitySubscription":
        return "Productivity";
      case "EssentialUtility":
        return "Essential";
      case "NonEssentialUtility":
        return "Non-essential";
      case "OneTimeDebt":
        return "One-time";
      case "RecurringDebt":
        return "Recurring";
      default:
        return bill.name.replace("Bill", "");
    }
  }
}

// NOTE: UI class
class TrackerUI {
  // NOTE: Private fields
  private _root: HTMLDivElement;
  private _manager: BillManager;
  private _isBound = false;
  private _formCategory: HTMLSelectElement | null;
  private _formType: HTMLSelectElement | null;
  private _formTypeField: HTMLElement | null;
  private _formCycleField: HTMLElement | null;
  private _formEl: HTMLFormElement | null;
  private _budgetFormEl: HTMLFormElement | null;
  private _budgetErrorEl: HTMLElement | null;
  private _totalBudgetEl: HTMLElement | null;
  private _remainingEl: HTMLElement | null;

  constructor(root: HTMLDivElement, manager: BillManager) {
    this._root = root;
    this._manager = manager;
    this._formCategory =
      this._root.querySelector<HTMLSelectElement>("[data-category]");
    this._formType = this._root.querySelector<HTMLSelectElement>("[data-type]");
    this._formTypeField =
      this._root.querySelector<HTMLElement>("[data-type-field]");
    this._formCycleField = this._root.querySelector<HTMLElement>("[data-billing-cycle-field]");
    this._formEl = this._root.querySelector<HTMLFormElement>("[data-form]");
    this._budgetFormEl = this._root.querySelector<HTMLFormElement>("[data-budget-form]");
    this._budgetErrorEl = this._root.querySelector<HTMLElement>("#budget-error");
    this._totalBudgetEl = this._root.querySelector<HTMLElement>("[data-total-budget]");
    this._remainingEl = this._root.querySelector<HTMLElement>("[data-remaining]");
    this.bindEvents();
  }

  // NOTE: Public methods
  public render(): void {
    this.updateTotals();
    this.renderGroups();
  }

  // NOTE: Private methods
  private bindEvents(): void {
    if (this._isBound) {
      return;
    }

    this._formCategory?.addEventListener("change", this.onCategoryChange);

    this._root
      .querySelectorAll<HTMLUListElement>("[data-group-list]")
      .forEach((listEl) => {
        listEl.addEventListener("click", this.onListClick);
      });

    this._formEl?.addEventListener("submit", this.onFormSubmit);
    
    this._budgetFormEl?.addEventListener("submit", this.onBudgetSubmit);

    this.syncTypeOptions("");

    this._isBound = true;
  }

   private onBudgetSubmit = (event: Event): void => {
    event.preventDefault();
    if (!this._budgetFormEl) return;

    const formData = new FormData(this._budgetFormEl);
    const total = Number(formData.get("totalBudget"));
    const subs = Number(formData.get("subBudget"));
    const utils = Number(formData.get("utilBudget"));
    const debts = Number(formData.get("debtBudget"));

    if (subs + utils + debts > total) {
      if (this._budgetErrorEl) this._budgetErrorEl.style.display = "block";
      return;
    }

    if (this._budgetErrorEl) this._budgetErrorEl.style.display = "none";

    this._manager.setBudgets(total, subs, utils, debts);
    this.render();
  };

  private onCategoryChange = (): void => {
    if (!this._formCategory) {
      return;
    }
    this.syncTypeOptions(this._formCategory.value);
  };

  private onListClick = (event: Event): void => {
    const target = event.target as HTMLElement | null;
    const deleteButton = target?.closest<HTMLButtonElement>("[data-delete-id]");
    if (!deleteButton) {
      return;
    }
    const billId = deleteButton.getAttribute("data-delete-id");
    const groupLabel = deleteButton.getAttribute("data-group");
    if (!billId || !groupLabel) {
      return;
    }
    this._manager.removeFromGroup(groupLabel, billId);
    this.render();
  };

  private onFormSubmit = (event: Event): void => {
    event.preventDefault();
    if (!this._formEl) {
      return;
    }
    const formData = new FormData(this._formEl);
    const name = String(formData.get("name") ?? "").trim();
    const category = String(formData.get("category") ?? "").trim();
    const billType = String(formData.get("billType") ?? "").trim();
    const amountValue = Number(formData.get("amount"));
    const billingCycle = (formData.get("billingCycle") as "monthly" | "annual") ?? "monthly";
    const interestRate = Number(formData.get("interestRate"));
    if (!name || !category || !billType || Number.isNaN(amountValue)) {
      return;
    }

    const bill = this._manager.createBill(
      billType,
      this.newId("bill"),
      name,
      amountValue,
        billingCycle,
        interestRate
    );
    this._manager.addToGroup(category, bill);
    this._formEl.reset();
    this.syncTypeOptions("");
    this.render();
  };

  private syncTypeOptions(category: string): void {
    if (!this._formType || !this._formTypeField || !this._formCycleField) {
      return;
    }
    const hasCategory = category.length > 0;
    this._formTypeField.hidden = !hasCategory;
    this._formCycleField.hidden = category !== "Subscriptions";

    Array.from(this._formType.options).forEach((option) => {
      const isMatch = option.dataset.category === category;
      option.hidden = !isMatch;
      option.disabled = !isMatch;
    });

    if (!hasCategory) {
      this._formType.value = "";
      return;
    }

    const firstMatchingType = Array.from(this._formType.options).find(
      (option) => option.dataset.category === category,
    );
    if (firstMatchingType) {
      this._formType.value = firstMatchingType.value;
    }
  }

  private updateTotals(): void {
    const totalValueEl = this._root.querySelector<HTMLElement>("[data-total]");
    const totalExp = this._manager.getTotal();
    const totalBudg = this._manager.totalBudget;
    const remaining = totalBudg - totalExp;

    if (totalValueEl) {
      totalValueEl.textContent = this.money(totalExp);
    }
    
    if (this._totalBudgetEl) {
      this._totalBudgetEl.textContent = this.money(totalBudg);
    }
    
    if (this._remainingEl) {
      this._remainingEl.textContent = this.money(remaining);
      
      if (remaining < 0) {
        this._remainingEl.style.color = remaining < 0 ? "#dc2626" : "inherit";
        this._remainingEl.style.fontWeight = remaining < 0 ? "700" : "500";
      }
    }
  }

  private renderGroups(): void {
    this._root
      .querySelectorAll<HTMLElement>("[data-group-card]")
      .forEach((card) => {
        const label = card.getAttribute("data-group-card") ?? "";
        const totalEl = card.querySelector<HTMLElement>("[data-group-total]");
        const listEl =
          card.querySelector<HTMLUListElement>("[data-group-list]");
        if (!label || !totalEl || !listEl) {
          return;
        }
        const group = this._manager
          .getGroups()
          .find((item) => item.label === label);
        if (!group) {
          return;
        }
        const total = group.items.reduce(
          (sum, item) => sum + item.monthlyImpact(),
          0,
        );
        totalEl.textContent = this.money(total);

        const budgetVal = this._manager.getCategoryBudget(label);
        const budgetDisplayEl = card.querySelector<HTMLElement>(`[data-group-budget="${label}"]`);

        if (budgetDisplayEl) {
          budgetDisplayEl.textContent = this.money(budgetVal);

          if (total > budgetVal && budgetVal > 0) {
            budgetDisplayEl.style.color = "#dc2626";
            budgetDisplayEl.style.fontWeight = "bold";
          } else {
            budgetDisplayEl.style.color = "var(--muted)";
            budgetDisplayEl.style.fontWeight = "normal";
          }
        }

        listEl.replaceChildren();
        const sortedItems = [...group.items].sort(
          (a, b) => b.priority() - a.priority(),
        );
        sortedItems.forEach((item) => {
          const listItem = document.createElement("li");
          const billTypeLabel = item.getBillTypeLabel();
          listItem.setAttribute("data-bill-type", billTypeLabel);
          const content = document.createElement("div");
          const name = document.createElement("p");
          name.className = "bill-name";
          name.textContent = item.name;
          content.appendChild(name);
          const note = document.createElement("p");
          note.className = "bill-note";
          note.textContent = billTypeLabel;
          content.appendChild(note);
          const value = document.createElement("span");
          value.className = "bill-value";
          value.textContent = this.money(item.monthlyImpact());
          const deleteButton = document.createElement("button");
          deleteButton.className = "delete-button";
          deleteButton.type = "button";
          deleteButton.textContent = "Delete";
          deleteButton.setAttribute("aria-label", `Delete ${item.name}`);
          deleteButton.setAttribute("data-delete-id", item.id);
          deleteButton.setAttribute("data-group", group.label);
          listItem.append(content, value, deleteButton);
          listEl.appendChild(listItem);
        });
      });
  }

  private newId(prefix: string): string {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  private money(value: number): string {
    return `₱${value.toFixed(2)}`;
  }
}

// NOTE: Initialization
const groups: CategoryGroup[] = [
  {
    label: "Subscriptions",
    items: [],
  },
  {
    label: "Utilities",
    items: [],
  },
  {
    label: "Debts",
    items: [],
  },
];

const root = document.querySelector<HTMLDivElement>("#app")!;
const manager = new BillManager(groups);
const ui = new TrackerUI(root, manager);
ui.render();