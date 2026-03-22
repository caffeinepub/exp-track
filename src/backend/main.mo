import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Float "mo:core/Float";
import Int "mo:core/Int";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";

import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import OutCall "http-outcalls/outcall";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Include storage and authorization
  include MixinStorage();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Types
  public type UserProfile = {
    displayName : Text;
  };

  public type Expense = {
    amount : Float;
    description : Text;
    date : Int;
    imageId : ?Storage.ExternalBlob;
    userName : Text;
    occasionId : ?Text;
  };

  public type Occasion = {
    id : Text;
    name : Text;
    description : Text;
    createdBy : Principal;
    createdAt : Int;
    participants : [Text];
  };

  public type OCRParams = {
    base64Image : Text;
  };

  public type OCRResponse = {
    amount : ?Float;
    rawText : Text;
  };

  module Expense {
    public func compare(e1 : Expense, e2 : Expense) : Order.Order {
      Float.compare(e1.amount, e2.amount);
    };

    public func compareByDate(e1 : Expense, e2 : Expense) : Order.Order {
      Int.compare(e1.date, e2.date);
    };
  };

  module Occasion {
    public func compare(oc1 : Occasion, oc2 : Occasion) : Order.Order {
      Text.compare(oc1.id, oc2.id);
    };
  };

  module Profile {
    public func compare(p1 : UserProfile, p2 : UserProfile) : Order.Order {
      Text.compare(p1.displayName, p2.displayName);
    };
  };

  // Persistent storage
  let expenses = Map.empty<Principal, Map.Map<Nat, Expense>>();
  let occasions = Map.empty<Text, Occasion>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  var nextExpenseId = 0;

  // Helpers
  func getUserProfileInternal(principal : Principal) : UserProfile {
    switch (userProfiles.get(principal)) {
      case (?profile) { profile };
      case (null) { Runtime.trap("User profile not found") };
    };
  };

  func getNextExpenseId() : Nat {
    let id = nextExpenseId;
    nextExpenseId += 1;
    id;
  };

  // Expense Management
  public shared ({ caller }) func createExpense(expense : Expense) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create expenses");
    };
    let expenseId = getNextExpenseId();
    let updatedExpense : Expense = {
      expense with date = Time.now();
    };

    let userExpenses = switch (expenses.get(caller)) {
      case (null) { Map.empty<Nat, Expense>() };
      case (?userExpenses) { userExpenses };
    };

    userExpenses.add(expenseId, updatedExpense);
    expenses.add(caller, userExpenses);
    expenseId;
  };

  public query ({ caller }) func getAllExpenses() : async [Expense] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view expenses");
    };
    expenses.values().flatMap(
      func(expenseMap) {
        expenseMap.values();
      }
    ).toArray();
  };

  public query ({ caller }) func getExpensesByUser(user : Principal) : async [Expense] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view expenses");
    };
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own expenses unless admin");
    };
    switch (expenses.get(user)) {
      case (?userExpenses) {
        userExpenses.values().sort(Expense.compareByDate).toArray();
      };
      case (null) { [] };
    };
  };

  public query ({ caller }) func getExpensesByOccasion(occasionId : Text) : async [Expense] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view expenses");
    };
    expenses.values().flatMap(
      func(expenseMap) {
        expenseMap.values().filter(
          func(expense) {
            expense.occasionId == ?occasionId;
          }
        );
      }
    ).toArray();
  };

  // Occasion Management
  public shared ({ caller }) func createOccasion(name : Text, description : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create occasions");
    };
    let id = name.concat(Time.now().toText());
    let occasion : Occasion = {
      id;
      name;
      description;
      createdBy = caller;
      createdAt = Time.now();
      participants = [];
    };
    occasions.add(id, occasion);
    id;
  };

  public query ({ caller }) func getAllOccasions() : async [Occasion] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view occasions");
    };
    occasions.values().sort().toArray();
  };

  public shared ({ caller }) func addParticipantToOccasion(occasionId : Text, participantName : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add participants");
    };
    switch (occasions.get(occasionId)) {
      case (?occasion) {
        if (occasion.createdBy != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only the occasion creator or admin can add participants");
        };
        let updatedParticipants = occasion.participants.concat([participantName]);
        let updatedOccasion : Occasion = {
          occasion with participants = updatedParticipants;
        };
        occasions.add(occasionId, updatedOccasion);
      };
      case (null) { Runtime.trap("Occasion not found") };
    };
  };

  // Profile Management
  public shared ({ caller }) func setDisplayName(displayName : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can set display name");
    };
    let profile : UserProfile = {
      displayName;
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile unless admin");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Aggregate Totals
  public query ({ caller }) func getAggregateTotals() : async [(Text, Float)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view aggregate totals");
    };
    let totals = Map.empty<Text, Float>();

    func updateTotal(userName : Text, amount : Float) {
      let currentTotal = switch (totals.get(userName)) {
        case (?t) { t };
        case (null) { 0.0 };
      };
      totals.add(userName, currentTotal + amount);
    };

    expenses.values().forEach(
      func(userExpenses) {
        userExpenses.values().forEach(
          func(expense) {
            updateTotal(expense.userName, expense.amount);
          }
        );
      }
    );

    totals.toArray();
  };

  // OCR Outcall
  public query ({ caller }) func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public shared ({ caller }) func extractAmountFromImage(params : OCRParams) : async OCRResponse {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can extract amounts from images");
    };
    let url = "https://api.freeocr.io/v1/ocr";
    let payload = "{ \"base64Image\": \"".concat(params.base64Image).concat("\" }");

    let responseText = await OutCall.httpPostRequest(url, [], payload, transform);
    {
      amount = ?0.0;
      rawText = responseText;
    };
  };

  // File Storage for Images
  public shared ({ caller }) func uploadImage(params : Storage.ExternalBlob) : async Storage.ExternalBlob {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upload images");
    };
    params;
  };

  // Admin Reset
  public shared ({ caller }) func reset() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can reset data");
    };
    expenses.clear();
    occasions.clear();
    userProfiles.clear();
    nextExpenseId := 0;
  };
};
